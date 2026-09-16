package expensetracker.common.actions

import cats.effect.{Deferred, IO, Ref}
import kirill5k.common.cats.test.IOWordSpec
import expensetracker.fixtures.{Accounts, Categories, PeriodicTransactions, Transactions, Users}
import expensetracker.account.{Account, AccountId, AccountService}
import expensetracker.auth.user.{User, UserId, UserService}
import expensetracker.category.{Category, CategoryId, CategoryService}
import expensetracker.transaction.{PeriodicTransaction, PeriodicTransactionService, RecurrenceCheckpoint, Transaction, TransactionService}
import kirill5k.common.cats.Clock
import fs2.Stream
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger
import squants.market.{Currency, GBP}

import scala.concurrent.duration.*
import java.time.Instant

class ActionProcessorSpec extends IOWordSpec {

  given Clock[IO]  = Clock.mock(Instant.parse("2024-11-10T01:00:00Z"))
  given Logger[IO] = Slf4jLogger.getLogger[IO]

  "An ActionProcessor" should {

    "discard captured recurrence writes replayed after clear-data completes" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      val ptx                                     = PeriodicTransactions.tx()
      val checkpoint                              = RecurrenceCheckpoint(ptx.id, ptx.userId, ptx.recurrence, ptx.recurrence.nextDate)
      val captured = Action.SaveGeneratedRecurrences(List(ptx.toTransaction(Transactions.txdate)), List(checkpoint))
      when(txSvc.deleteAll(any[UserId])).thenReturnUnit
      when(catSvc.deleteAll(any[UserId])).thenReturnUnit
      when(accSvc.deleteAll(any[UserId])).thenReturnUnit

      val result = for
        sources    <- Ref.of[IO, Set[expensetracker.transaction.TransactionId]](Set(ptx.id))
        _          <- IO(when(ptxSvc.validCheckpointIds(anyList[RecurrenceCheckpoint])).thenReturn(sources.get))
        _          <- IO(when(ptxSvc.deleteAll(any[UserId])).thenReturn(sources.set(Set.empty)))
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- processor.run.compile.drain.background.use { _ =>
          dispatcher.dispatchAndAwait(Action.DeleteAllUserData(Users.uid1)) >> dispatcher.dispatchAndAwait(captured)
        }
      yield ()

      result.asserting { _ =>
        verify(txSvc, never).saveGenerated(anyList[Transaction])
        verify(ptxSvc, never).advanceRecurrences(anyList[RecurrenceCheckpoint])
        verify(ptxSvc).validCheckpointIds(List(checkpoint))
        succeed
      }
    }

    "wait for a generated write already in progress before clearing data" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      val ptx                                     = PeriodicTransactions.tx()
      val txs                                     = List(ptx.toTransaction(Transactions.txdate))
      val checkpoint                              = RecurrenceCheckpoint(ptx.id, ptx.userId, ptx.recurrence, ptx.recurrence.nextDate)
      val clear                                   = Action.DeleteAllUserData(Users.uid1)
      when(ptxSvc.validCheckpointIds(anyList[RecurrenceCheckpoint])).thenReturnIO(Set(ptx.id))
      when(ptxSvc.advanceRecurrences(anyList[RecurrenceCheckpoint])).thenReturnUnit
      when(ptxSvc.deleteAll(any[UserId])).thenReturnUnit
      when(catSvc.deleteAll(any[UserId])).thenReturnUnit
      when(accSvc.deleteAll(any[UserId])).thenReturnUnit

      val result = for
        ledger        <- Ref.of[IO, List[Transaction]](Nil)
        writeStarted  <- Deferred[IO, Unit]
        releaseWrite  <- Deferred[IO, Unit]
        clearDequeued <- Deferred[IO, Unit]
        clearReturned <- Deferred[IO, Unit]
        _             <- IO(
          when(txSvc.saveGenerated(anyList[Transaction])).thenReturn(writeStarted.complete(()).void >> releaseWrite.get >> ledger.set(txs))
        )
        _        <- IO(when(txSvc.deleteAll(any[UserId])).thenReturn(ledger.set(Nil)))
        delegate <- ActionDispatcher.make[IO]
        dispatcher = observeAction(delegate, clear, clearDequeued)
        processor    <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        observations <- processor.run.compile.drain.background.use { _ =>
          for
            write     <- dispatcher.dispatchAndAwait(Action.SaveGeneratedRecurrences(txs, List(checkpoint))).start
            _         <- writeStarted.get
            cleanup   <- (dispatcher.dispatchAndAwait(clear) >> clearReturned.complete(()).void).start
            _         <- clearDequeued.get
            before    <- clearReturned.tryGet
            _         <- IO(verify(txSvc, never).deleteAll(any[UserId]))
            _         <- releaseWrite.complete(())
            _         <- write.joinWithNever
            _         <- cleanup.joinWithNever
            remaining <- ledger.get
          yield (before, remaining)
        }
      yield observations

      result.asserting { case (before, remaining) =>
        before mustBe None
        remaining mustBe Nil
      }
    }

    "finish a canceled caller's cleanup before a retry can delete data or acknowledge completion" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(txSvc.deleteAll(any[UserId])).thenReturnUnit
      when(catSvc.deleteAll(any[UserId])).thenReturnUnit
      when(accSvc.deleteAll(any[UserId])).thenReturnUnit

      val result = for
        delegate       <- ActionDispatcher.make[IO]
        queued         <- Ref.of[IO, Int](0)
        executions     <- Ref.of[IO, Int](0)
        firstStarted   <- Deferred[IO, Unit]
        secondDequeued <- Deferred[IO, Unit]
        secondStarted  <- Deferred[IO, Unit]
        releaseFirst   <- Deferred[IO, Unit]
        releaseSecond  <- Deferred[IO, Unit]
        retryReturned  <- Deferred[IO, Unit]
        _              <- IO(when(ptxSvc.deleteAll(any[UserId])).thenReturn(executions.updateAndGet(_ + 1).flatMap {
          case 1 => firstStarted.complete(()).void >> releaseFirst.get
          case _ => secondStarted.complete(()).void >> releaseSecond.get
        }))
        dispatcher = new ActionDispatcher[IO] {
          def dispatch(action: Action): IO[Unit]         = delegate.dispatch(action)
          def dispatchAndAwait(action: Action): IO[Unit] = delegate.dispatchAndAwait(action)
          def stream: Stream[IO, Action]                 = delegate.stream
          def process(handle: Action => IO[Unit], onFailure: (Action, Throwable) => IO[Unit]): Stream[IO, Unit] =
            delegate.process(
              action =>
                queued.updateAndGet(_ + 1).flatMap {
                  case 2 => secondDequeued.complete(()).void
                  case _ => IO.unit
                } >> handle(action),
              onFailure
            )
        }
        processor    <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        observations <- processor.run.compile.drain.background.use { _ =>
          for
            first         <- dispatcher.dispatchAndAwait(Action.DeleteAllUserData(Users.uid1)).start
            _             <- firstStarted.get
            _             <- first.cancel
            retry         <- (dispatcher.dispatchAndAwait(Action.DeleteAllUserData(Users.uid1)) >> retryReturned.complete(()).void).start
            _             <- secondDequeued.get
            before        <- executions.get
            earlyResponse <- retryReturned.tryGet
            _             <- releaseFirst.complete(())
            _             <- secondStarted.get
            duringRetry   <- retryReturned.tryGet
            _             <- releaseSecond.complete(())
            _             <- retry.joinWithNever
          yield (before, earlyResponse, duringRetry)
        }
      yield observations

      result.asserting { case (executions, earlyResponse, duringRetry) =>
        executions mustBe 1
        earlyResponse mustBe None
        duringRetry mustBe None
        verify(accSvc, times(2)).deleteAll(Users.uid1)
        succeed
      }
    }

    "generate ptx instances" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(ptxSvc.generateRecurrencesForToday).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.GeneratePeriodicTransactionRecurrences)
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(ptxSvc).generateRecurrencesForToday
        verifyNoInteractions(txSvc, usrSvc, usrSvc, accSvc)
        r mustBe ()
      }
    }

    "setup new account" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(catSvc.assignDefault(any[UserId])).thenReturnUnit
      when(accSvc.createDefault(any[UserId], any[Currency])).thenReturnUnit

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.SetupNewUser(Users.uid1, GBP))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(catSvc).assignDefault(Users.uid1)
        verify(accSvc).createDefault(Users.uid1, GBP)
        verifyNoInteractions(txSvc, usrSvc, ptxSvc)
        r mustBe ()
      }
    }

    "hide transactions by category" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(txSvc.hideByCategory(any[CategoryId], anyBoolean)).thenReturn(IO.unit)
      when(ptxSvc.hideByCategory(any[CategoryId], anyBoolean)).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.HideTransactionsByCategory(Categories.cid, false))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(txSvc).hideByCategory(Categories.cid, false)
        verify(ptxSvc).hideByCategory(Categories.cid, false)
        verifyNoInteractions(catSvc, usrSvc, accSvc)
        r mustBe ()
      }
    }

    "hide transactions by accounts" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(txSvc.hideByAccount(any[AccountId], anyBoolean)).thenReturn(IO.unit)
      when(ptxSvc.hideByAccount(any[AccountId], anyBoolean)).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.HideTransactionsByAccount(Accounts.id, false))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(txSvc).hideByAccount(Accounts.id, false)
        verify(ptxSvc).hideByAccount(Accounts.id, false)
        verifyNoInteractions(catSvc, usrSvc, accSvc)
        r mustBe ()
      }
    }

    "save users" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(usrSvc.save(anyList[User])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.SaveUsers(List(Users.user)))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(usrSvc).save(List(Users.user))
        verifyNoInteractions(txSvc, catSvc, ptxSvc, accSvc)
        r mustBe ()
      }
    }

    "save cats" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(catSvc.save(anyList[Category])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.SaveCategories(List(Categories.cat())))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(catSvc).save(List(Categories.cat()))
        verifyNoInteractions(txSvc, usrSvc, ptxSvc, accSvc)
        r mustBe ()
      }
    }

    "save accs" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(accSvc.save(anyList[Account])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.SaveAccounts(List(Accounts.acc())))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(accSvc).save(List(Accounts.acc()))
        verifyNoInteractions(txSvc, usrSvc, ptxSvc, catSvc)
        r mustBe ()
      }
    }

    "save txs" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(txSvc.save(anyList[Transaction])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.SaveTransactions(List(Transactions.tx())))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(txSvc).save(List(Transactions.tx()))
        verifyNoInteractions(catSvc, usrSvc, ptxSvc, accSvc)
        r mustBe ()
      }
    }

    "save ptxs" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(ptxSvc.save(anyList[PeriodicTransaction])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.SavePeriodicTransactions(List(PeriodicTransactions.tx())))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(ptxSvc).save(List(PeriodicTransactions.tx()))
        verifyNoInteractions(catSvc, usrSvc, txSvc, accSvc)
        r mustBe ()
      }
    }

    "wait for generated ledger transactions to persist before saving their recurrence checkpoint" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      val ptx                                     = PeriodicTransactions.tx()
      val checkpoints                             = List(RecurrenceCheckpoint(ptx.id, ptx.userId, ptx.recurrence, ptx.recurrence.nextDate))
      val txs                                     = List(ptx.toTransaction(Transactions.txdate))
      when(ptxSvc.advanceRecurrences(anyList[RecurrenceCheckpoint])).thenReturnUnit
      when(ptxSvc.validCheckpointIds(anyList[RecurrenceCheckpoint])).thenReturnIO(Set(ptx.id))

      val result = for
        started    <- Deferred[IO, Unit]
        persisted  <- Deferred[IO, Unit]
        _          <- IO(when(txSvc.saveGenerated(anyList[Transaction])).thenReturn(started.complete(()).void >> persisted.get))
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.SaveGeneratedRecurrences(txs, checkpoints))
        processing <- processor.run.take(1).compile.drain.start
        _          <- started.get
        _          <- IO(verify(ptxSvc, never).advanceRecurrences(anyList[RecurrenceCheckpoint]))
        _          <- persisted.complete(())
        _          <- processing.joinWithNever
      yield ()

      result.asserting { _ =>
        verify(txSvc).saveGenerated(txs)
        verify(ptxSvc).advanceRecurrences(checkpoints)
        verifyNoInteractions(usrSvc, catSvc, accSvc)
        succeed
      }
    }

    "leave the recurrence checkpoint unchanged and retry after a ledger persistence failure" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      val ptx                                     = PeriodicTransactions.tx()
      val checkpoints                             = List(RecurrenceCheckpoint(ptx.id, ptx.userId, ptx.recurrence, ptx.recurrence.nextDate))
      val action = Action.SaveGeneratedRecurrences(List(ptx.toTransaction(Transactions.txdate)), checkpoints)
      when(txSvc.saveGenerated(anyList[Transaction]))
        .thenReturn(IO.raiseError(new RuntimeException("ledger unavailable")), IO.unit)
      when(ptxSvc.advanceRecurrences(anyList[RecurrenceCheckpoint])).thenReturnUnit
      when(ptxSvc.validCheckpointIds(anyList[RecurrenceCheckpoint])).thenReturnIO(Set(ptx.id))

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(action)
        _          <- processor.run.take(2).compile.drain
      yield ()

      result.asserting { _ =>
        verify(txSvc, times(2)).saveGenerated(List(ptx.toTransaction(Transactions.txdate)))
        verify(ptxSvc).advanceRecurrences(checkpoints)
        verifyNoInteractions(usrSvc, catSvc, accSvc)
        succeed
      }
    }

    "delete ptxs" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(ptxSvc.deleteAll(any[UserId])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.DeleteAllPeriodicTransactions(Users.uid1))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(ptxSvc).deleteAll(Users.uid1)
        verifyNoInteractions(catSvc, usrSvc, txSvc, accSvc)
        r mustBe ()
      }
    }

    "delete txs" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(txSvc.deleteAll(any[UserId])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.DeleteAllTransactions(Users.uid1))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(txSvc).deleteAll(Users.uid1)
        verifyNoInteractions(catSvc, usrSvc, ptxSvc, accSvc)
        r mustBe ()
      }
    }

    "delete cats" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(catSvc.deleteAll(any[UserId])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.DeleteAllCategories(Users.uid1))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(catSvc).deleteAll(Users.uid1)
        verifyNoInteractions(txSvc, usrSvc, ptxSvc, accSvc)
        r mustBe ()
      }
    }

    "delete accs" in {
      val (usrSvc, catSvc, txSvc, ptxSvc, accSvc) = mocks
      when(accSvc.deleteAll(any[UserId])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.DeleteAllAccounts(Users.uid1))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(accSvc).deleteAll(Users.uid1)
        verifyNoInteractions(txSvc, usrSvc, ptxSvc, catSvc)
        r mustBe ()
      }
    }
  }

  def mocks: (UserService[IO], CategoryService[IO], TransactionService[IO], PeriodicTransactionService[IO], AccountService[IO]) =
    (
      mock[UserService[IO]],
      mock[CategoryService[IO]],
      mock[TransactionService[IO]],
      mock[PeriodicTransactionService[IO]],
      mock[AccountService[IO]]
    )

  private def observeAction(delegate: ActionDispatcher[IO], observed: Action, dequeued: Deferred[IO, Unit]): ActionDispatcher[IO] =
    new ActionDispatcher[IO] {
      def dispatch(action: Action): IO[Unit]         = delegate.dispatch(action)
      def dispatchAndAwait(action: Action): IO[Unit] = delegate.dispatchAndAwait(action)
      def stream: Stream[IO, Action]                 = delegate.stream
      def process(handle: Action => IO[Unit], onFailure: (Action, Throwable) => IO[Unit]): Stream[IO, Unit] =
        delegate.process(action => IO.whenA(action == observed)(dequeued.complete(()).void) >> handle(action), onFailure)
    }
}
