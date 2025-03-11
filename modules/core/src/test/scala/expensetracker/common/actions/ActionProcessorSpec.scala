package expensetracker.common.actions

import cats.effect.IO
import kirill5k.common.cats.test.IOWordSpec
import expensetracker.fixtures.{Accounts, Categories, PeriodicTransactions, Transactions, Users}
import expensetracker.account.{Account, AccountId, AccountService}
import expensetracker.auth.user.{User, UserId, UserService}
import expensetracker.category.{Category, CategoryId, CategoryService}
import expensetracker.transaction.{PeriodicTransaction, PeriodicTransactionService, Transaction, TransactionService}
import kirill5k.common.cats.Clock
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger
import squants.market.GBP

import scala.concurrent.duration.*
import java.time.Instant

class ActionProcessorSpec extends IOWordSpec {

  given Clock[IO]  = Clock.mock(Instant.parse("2024-11-10T01:00:00Z"))
  given Logger[IO] = Slf4jLogger.getLogger[IO]

  "An ActionProcessor" should {

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
      when(catSvc.assignDefault(any[UserId])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _          <- dispatcher.dispatch(Action.SetupNewUser(Users.uid1, GBP))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(catSvc).assignDefault(Users.uid1)
        verifyNoInteractions(txSvc, usrSvc, ptxSvc, accSvc)
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
        processor <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc, ptxSvc, accSvc)
        _ <- dispatcher.dispatch(Action.DeleteAllAccounts(Users.uid1))
        res <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(accSvc).deleteAll(Users.uid1)
        verifyNoInteractions(txSvc, usrSvc, ptxSvc, catSvc)
        r mustBe()
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
}
