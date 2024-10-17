package expensetracker.common.actions

import cats.effect.IO
import kirill5k.common.cats.test.IOWordSpec
import expensetracker.fixtures.{Categories, Transactions, Users}
import expensetracker.auth.user.{User, UserId, UserService}
import expensetracker.category.{Category, CategoryId, CategoryService}
import expensetracker.transaction.{Transaction, TransactionService}
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

import scala.concurrent.duration.*

class ActionProcessorSpec extends IOWordSpec {

  given Logger[IO] = Slf4jLogger.getLogger[IO]

  "An ActionProcessor" should {

    "setup new account" in {
      val (usrSvc, catSvc, txSvc) = mocks
      when(catSvc.assignDefault(any[UserId])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc)
        _          <- dispatcher.dispatch(Action.SetupNewUser(Users.uid1))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(catSvc).assignDefault(Users.uid1)
        verifyNoInteractions(txSvc, usrSvc)
        r mustBe ()
      }
    }

    "hide transactions by category" in {
      val (usrSvc, catSvc, txSvc) = mocks
      when(txSvc.hide(any[CategoryId], anyBoolean)).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc)
        _          <- dispatcher.dispatch(Action.HideTransactionsByCategory(Categories.cid, false))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(txSvc).hide(Categories.cid, false)
        verifyNoInteractions(catSvc, usrSvc)
        r mustBe ()
      }
    }

    "save users" in {
      val (usrSvc, catSvc, txSvc) = mocks
      when(usrSvc.save(anyList[User])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc)
        _          <- dispatcher.dispatch(Action.SaveUsers(List(Users.user)))
        res        <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(usrSvc).save(List(Users.user))
        verifyNoInteractions(txSvc, catSvc)
        r mustBe ()
      }
    }

    "save cats" in {
      val (usrSvc, catSvc, txSvc) = mocks
      when(catSvc.save(anyList[Category])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc)
        _ <- dispatcher.dispatch(Action.SaveCategories(List(Categories.cat())))
        res <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(catSvc).save(List(Categories.cat()))
        verifyNoInteractions(txSvc, usrSvc)
        r mustBe()
      }
    }

    "save tcs" in {
      val (usrSvc, catSvc, txSvc) = mocks
      when(txSvc.save(anyList[Transaction])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor <- ActionProcessor.make[IO](dispatcher, usrSvc, catSvc, txSvc)
        _ <- dispatcher.dispatch(Action.SaveTransactions(List(Transactions.tx())))
        res <- processor.run.interruptAfter(1.second).compile.drain
      yield res

      result.asserting { r =>
        verify(txSvc).save(List(Transactions.tx()))
        verifyNoInteractions(catSvc, usrSvc)
        r mustBe()
      }
    }
  }

  def mocks: (UserService[IO], CategoryService[IO], TransactionService[IO]) =
    (mock[UserService[IO]], mock[CategoryService[IO]], mock[TransactionService[IO]])
}
