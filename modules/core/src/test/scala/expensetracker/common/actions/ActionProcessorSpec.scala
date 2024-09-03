package expensetracker.common.actions

import cats.effect.IO
import kirill5k.common.cats.test.IOWordSpec
import expensetracker.fixtures.{Categories, Users}
import expensetracker.auth.user.UserId
import expensetracker.category.{CategoryId, CategoryService}
import expensetracker.transaction.TransactionService
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

import scala.concurrent.duration.*

class ActionProcessorSpec extends IOWordSpec {

  given Logger[IO] = Slf4jLogger.getLogger[IO]

  "An ActionProcessor" should {

    "setup new account" in {
      val (catSvc, txSvc) = mocks
      when(catSvc.assignDefault(any[UserId])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, catSvc, txSvc)
        _          <- dispatcher.dispatch(Action.SetupNewUser(Users.uid1))
        res        <- processor.run.interruptAfter(2.second).compile.drain
      yield res

      result.asserting { r =>
        verify(catSvc).assignDefault(Users.uid1)
        verifyNoInteractions(txSvc)
        r mustBe ()
      }
    }

    "hide transactions by category" in {
      val (catSvc, txSvc) = mocks
      when(txSvc.hide(any[CategoryId], anyBoolean)).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor <- ActionProcessor.make[IO](dispatcher, catSvc, txSvc)
        _ <- dispatcher.dispatch(Action.HideTransactionsByCategory(Categories.cid, false))
        res <- processor.run.interruptAfter(2.second).compile.drain
      yield res

      result.asserting { r =>
        verify(txSvc).hide(Categories.cid, false)
        verifyNoInteractions(catSvc)
        r mustBe()
      }
    }
  }

  def mocks: (CategoryService[IO], TransactionService[IO]) =
    (mock[CategoryService[IO]], mock[TransactionService[IO]])
}
