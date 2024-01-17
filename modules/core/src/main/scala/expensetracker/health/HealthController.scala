package expensetracker.health

import cats.effect.Async
import cats.effect.Temporal
import cats.syntax.functor.*
import expensetracker.auth.Authenticator
import io.circe.Codec
import expensetracker.common.web.{Controller, TapirJson, TapirSchema}

import java.time.Instant
import org.http4s.HttpRoutes
import sttp.tapir.*
import sttp.tapir.server.ServerEndpoint
import sttp.tapir.server.http4s.Http4sServerInterpreter

final class HealthController[F[_]: Async](
    private val startupTime: Instant
) extends Controller[F] {

  private val statusEndpoint: ServerEndpoint[Any, F] = infallibleEndpoint.get
    .in("health" / "status")
    .out(jsonBody[HealthController.AppStatus])
    .serverLogicPure(_ => Right(HealthController.AppStatus(startupTime)))

  def routes(using auth: Authenticator[F]): HttpRoutes[F] =
    Http4sServerInterpreter[F]().toRoutes(statusEndpoint)
}

object HealthController extends TapirSchema with TapirJson {

  final case class AppStatus(
      service: String,
      startupTime: Instant,
      upTime: String,
      appVersion: Option[String],
      serverIpAddress: String
  ) derives Codec.AsObject

  val statusEndpoint = infallibleEndpoint.get
    .in("health" / "status")
    .out(jsonBody[AppStatus])

  def make[F[_]: Async]: F[Controller[F]] =
    Temporal[F].realTimeInstant.map(startupTime => HealthController[F](startupTime))
}
