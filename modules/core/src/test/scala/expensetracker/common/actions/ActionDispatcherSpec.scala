package expensetracker.common.actions

import cats.effect.{Deferred, IO}
import expensetracker.fixtures.Users
import kirill5k.common.cats.test.IOWordSpec

import java.util.concurrent.CancellationException

class ActionDispatcherSpec extends IOWordSpec {
  private val action = Action.DeleteAllUserData(Users.uid1)

  "ActionDispatcher" should {
    "acknowledge an awaited action only after its handler finishes" in {
      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        started <- Deferred[IO, Unit]
        release <- Deferred[IO, Unit]
        returned <- Deferred[IO, Unit]
        caller <- (dispatcher.dispatchAndAwait(action) >> returned.complete(()).void).start
        worker <- dispatcher.process(_ => started.complete(()).void >> release.get, (_, error) => IO.raiseError(error)).take(1).compile.drain.start
        _ <- started.get
        before <- returned.tryGet
        _ <- release.complete(())
        _ <- worker.joinWithNever
        _ <- caller.joinWithNever
      yield before

      result.asserting(_ mustBe None)
    }

    "propagate awaited failures without dispatching a background retry" in {
      val failure = new RuntimeException("cleanup failed")
      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        caller <- dispatcher.dispatchAndAwait(action).attempt.start
        _ <- dispatcher.process(_ => IO.raiseError(failure), (_, _) => IO.raiseError(new AssertionError("must not retry awaited actions"))).take(1).compile.drain
        response <- caller.joinWithNever
        _ <- dispatcher.dispatch(Action.DeleteAllAccounts(Users.uid1))
        next <- dispatcher.stream.take(1).compile.lastOrError
      yield (response, next)

      result.asserting { case (response, next) =>
        response mustBe Left(failure)
        next mustBe Action.DeleteAllAccounts(Users.uid1)
      }
    }

    "release an awaiting caller when its active processor is canceled" in {
      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        started <- Deferred[IO, Unit]
        caller <- dispatcher.dispatchAndAwait(action).attempt.start
        worker <- dispatcher.process(_ => started.complete(()).void >> IO.never, (_, error) => IO.raiseError(error)).compile.drain.start
        _ <- started.get
        _ <- worker.cancel
        response <- caller.joinWithNever
      yield response

      result.asserting { response => response.left.toOption.get mustBe a[CancellationException] }
    }
  }
}
