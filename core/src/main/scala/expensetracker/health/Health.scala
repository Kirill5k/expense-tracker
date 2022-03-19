package expensetracker.health

import cats.effect.Async
import cats.syntax.functor._
import org.http4s.HttpRoutes

final class Health[F[_]] private (
    val controller: HealthController[F]
)

object Health {
  def make[F[_]: Async]: F[Health[F]] =
    HealthController.make[F].map(c => new Health[F](c))
}
