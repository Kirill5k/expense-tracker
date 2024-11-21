package expensetracker.common.actions

import cats.effect.IO
import kirill5k.common.cats.test.IOWordSpec
import expensetracker.fixtures.{Categories, Transactions, Users, PeriodicTransactions}
import expensetracker.auth.user.{User, UserId, UserService}
import expensetracker.category.{Category, CategoryId, CategoryService}
import expensetracker.transaction.{Transaction, PeriodicTransaction, TransactionService, PeriodicTransactionService}
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

import scala.concurrent.duration.*

class ActionProcessorSpec extends IOWordSpec {

  given Logger[IO] = Slf4jLogger.getLogger[IO]

  "An ActionProcessor" should {

    "generate ptx instances" in {
      val (usrSvc, catSvc, txSvc, ptxSvc) = mocks
      when(ptxSvc.generateTxInstancesForToday).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc)
        _ <- dispatcher.dispatch(Action.GeneratePeriodicTransactionInstances)
        res <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(ptxSvc).generateTxInstancesForToday
        verifyNoInteractions(txSvc, usrSvc, usrSvc)
        r mustBe()
      }
    }

    "setup new account" in {
      val (usrSvc, catSvc, txSvc, ptxSvc) = mocks
      when(catSvc.assignDefault(any[UserId])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc)
        _          <- dispatcher.dispatch(Action.SetupNewUser(Users.uid1))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(catSvc).assignDefault(Users.uid1)
        verifyNoInteractions(txSvc, usrSvc, ptxSvc)
        r mustBe ()
      }
    }

    "hide transactions by category" in {
      val (usrSvc, catSvc, txSvc, ptxSvc) = mocks
      when(txSvc.hide(any[CategoryId], anyBoolean)).thenReturn(IO.unit)
      when(ptxSvc.hide(any[CategoryId], anyBoolean)).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc)
        _          <- dispatcher.dispatch(Action.HideTransactionsByCategory(Categories.cid, false))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(txSvc).hide(Categories.cid, false)
        verify(ptxSvc).hide(Categories.cid, false)
        verifyNoInteractions(catSvc, usrSvc)
        r mustBe ()
      }
    }

    "save users" in {
      val (usrSvc, catSvc, txSvc, ptxSvc) = mocks
      when(usrSvc.save(anyList[User])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc)
        _          <- dispatcher.dispatch(Action.SaveUsers(List(Users.user)))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(usrSvc).save(List(Users.user))
        verifyNoInteractions(txSvc, catSvc, ptxSvc)
        r mustBe ()
      }
    }

    "save cats" in {
      val (usrSvc, catSvc, txSvc, ptxSvc) = mocks
      when(catSvc.save(anyList[Category])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc)
        _ <- dispatcher.dispatch(Action.SaveCategories(List(Categories.cat())))
        res <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(catSvc).save(List(Categories.cat()))
        verifyNoInteractions(txSvc, usrSvc, ptxSvc)
        r mustBe()
      }
    }

    "save txs" in {
      val (usrSvc, catSvc, txSvc, ptxSvc) = mocks
      when(txSvc.save(anyList[Transaction])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc)
        _ <- dispatcher.dispatch(Action.SaveTransactions(List(Transactions.tx())))
        res <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(txSvc).save(List(Transactions.tx()))
        verifyNoInteractions(catSvc, usrSvc, ptxSvc)
        r mustBe()
      }
    }

    "save ptxs" in {
      val (usrSvc, catSvc, txSvc, ptxSvc) = mocks
      when(ptxSvc.save(anyList[PeriodicTransaction])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc)
        _ <- dispatcher.dispatch(Action.SavePeriodicTransactions(List(PeriodicTransactions.tx())))
        res <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(ptxSvc).save(List(PeriodicTransactions.tx()))
        verifyNoInteractions(catSvc, usrSvc, txSvc)
        r mustBe()
      }
    }
  }

  def mocks: (UserService[IO], CategoryService[IO], TransactionService[IO], PeriodicTransactionService[IO]) =
    (mock[UserService[IO]], mock[CategoryService[IO]], mock[TransactionService[IO]], mock[PeriodicTransactionService[IO]])
}
