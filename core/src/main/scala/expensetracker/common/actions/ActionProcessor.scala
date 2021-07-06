package expensetracker.common.actions

import cats.Monad
import cats.effect.Temporal
import expensetracker.category.{Categories, CategoryService}
import fs2.Stream

trait ActionProcessor[F[_]] {
  def process: Stream[F, Unit]
}

private final class LiveActionProcessor[F[_]] (
    private val dispatcher: ActionDispatcher[F],
    private val categoryService: CategoryService[F]
) extends ActionProcessor[F] {

  // TODO: error-handling
  override def process: Stream[F, Unit] =
    dispatcher
      .stream
      .evalMap {
        case Action.SetupNewAccount(aid) => categoryService.assignDefault(aid)
      }
}

object ActionProcessor {
  def make[F[_]: Temporal](dispatcher: ActionDispatcher[F], cats: Categories[F]): F[ActionProcessor[F]] =
    Monad[F].pure(new LiveActionProcessor[F](dispatcher, cats.service))
}
