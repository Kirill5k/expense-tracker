package expensetracker.health

import cats.effect.Async
import cats.syntax.functor.*
import expensetracker.common.web.Controller
import org.http4s.HttpRoutes

final class Health[F[_]] private (
    val controller: Controller[F]
)

object Health {
  def make[F[_]: Async]: F[Health[F]] =
    HealthController.make[F].map(c => Health[F](c))
}
