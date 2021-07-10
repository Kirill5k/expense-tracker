package expensetracker.health

import cats.Monad
import cats.syntax.functor._
import org.http4s.HttpRoutes

final class Health[F[_]] private (
    val controller: HealthController[F]
) {
  val routes: HttpRoutes[F] = controller.routes
}

object Health {
  def make[F[_]: Monad]: F[Health[F]] =
    HealthController.make[F].map(c => new Health[F](c))
}
