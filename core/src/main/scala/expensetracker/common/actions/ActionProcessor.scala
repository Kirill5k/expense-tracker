package expensetracker.common.actions

import cats.Monad
import cats.effect.Temporal
import cats.syntax.apply.*
import cats.syntax.applicativeError.*
import expensetracker.category.CategoryService
import expensetracker.common.errors.AppError
import fs2.Stream
import org.typelevel.log4cats.Logger

import scala.concurrent.duration.*

trait ActionProcessor[F[_]]:
  def run: Stream[F, Unit]

final private class LiveActionProcessor[F[_]: Temporal: Logger](
    private val dispatcher: ActionDispatcher[F],
    private val categoryService: CategoryService[F]
) extends ActionProcessor[F] {

  override def run: Stream[F, Unit] =
    dispatcher.stream
      .parEvalMapUnordered(Int.MaxValue)(handleAction)

  private def handleAction(action: Action): F[Unit] =
    (action match {
      case Action.SetupNewUser(id) => categoryService.assignDefault(id)
    }).handleErrorWith {
      case error: AppError =>
        Logger[F].warn(error)(s"domain error while processing action $action")
      case error =>
        Logger[F].error(error)(s"unexpected error processing action $action") *>
          Temporal[F].sleep(1.second) *>
          dispatcher.dispatch(action)
    }
}

object ActionProcessor:
  def make[F[_]: Temporal: Logger](dispatcher: ActionDispatcher[F], catSvc: CategoryService[F]): F[ActionProcessor[F]] =
    Monad[F].pure(LiveActionProcessor[F](dispatcher, catSvc))
