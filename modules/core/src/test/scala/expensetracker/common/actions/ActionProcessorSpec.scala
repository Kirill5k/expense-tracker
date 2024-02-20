package expensetracker.common.actions

import cats.effect.IO
import expensetracker.IOWordSpec
import expensetracker.fixtures.Users
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryService
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.{verify, when}

import scala.concurrent.duration._

class ActionProcessorSpec extends IOWordSpec {

  "An ActionProcessor" should {

    "setup new account" in {
      val catSvc = mocks
      when(catSvc.assignDefault(any[UserId])).thenReturn(IO.unit)

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        processor  <- ActionProcessor.make[IO](dispatcher, catSvc)
        _          <- dispatcher.dispatch(Action.SetupNewUser(Users.uid1))
        res        <- processor.run.interruptAfter(2.second).compile.drain
      yield res

      result.asserting { r =>
        verify(catSvc).assignDefault(Users.uid1)
        r mustBe ()
      }
    }
  }

  def mocks: CategoryService[IO] =
    mock[CategoryService[IO]]
}
