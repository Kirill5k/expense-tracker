package expensetracker.common.actions

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.account.AccountId
import expensetracker.category.CategoryService

import scala.concurrent.duration._

class ActionProcessorSpec extends CatsSpec {

  "An ActionProcessor" should {

    "setup new account" in {
      val catSvc = mocks
      when(catSvc.assignDefault(any[AccountId])).thenReturn(IO.unit)

      val result = for {
        dispatcher <- ActionDispatcher.make[IO]
        processor <- ActionProcessor.make[IO](dispatcher, catSvc)
        _ <- dispatcher.dispatch(Action.SetupNewAccount(aid))
        res <- processor.process.interruptAfter(2.second).compile.drain
      } yield res

      result.unsafeToFuture().map { r =>
        verify(catSvc).assignDefault(aid)
        r mustBe ()
      }
    }
  }

  def mocks: CategoryService[IO] = {
    mock[CategoryService[IO]]
  }
}
