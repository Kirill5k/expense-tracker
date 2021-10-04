package expensetracker.health

import cats.Monad
import expensetracker.common.web.Controller
import expensetracker.health.HealthController.AppStatus
import io.circe.generic.auto._
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._

final class HealthController[F[_]: Monad] extends Controller[F] {
  val routes: HttpRoutes[F] =
    HttpRoutes.of[F] { case GET -> Root / "health" / "status" => Ok(AppStatus.UP) }
}

object HealthController {

  final case class AppStatus(status: Boolean)

  object AppStatus {
    val UP = AppStatus(true)
  }

  def make[F[_]: Monad]: F[HealthController[F]] =
    Monad[F].pure(new HealthController[F])

}
