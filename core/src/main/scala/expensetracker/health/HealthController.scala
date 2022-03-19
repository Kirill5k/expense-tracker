package expensetracker.health

import cats.effect.Async
import cats.effect.Ref
import cats.effect.Temporal
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import io.circe.Codec
import expensetracker.common.web.Controller
import java.time.Instant
import org.http4s.HttpRoutes
import sttp.tapir.*
import sttp.tapir.server.ServerEndpoint
import sttp.tapir.server.http4s.Http4sServerInterpreter
import sttp.tapir.generic.SchemaDerivation
import sttp.tapir.json.circe.TapirJsonCirce

final class HealthController[F[_]: Async](
    private val startupTime: Ref[F, Instant]
) extends Controller[F] with TapirJsonCirce with SchemaDerivation {

  given Schema[HealthController.AppStatus] = Schema.string

  private val statusEndpoint: ServerEndpoint[Any, F] = infallibleEndpoint.get
    .in("health" / "status")
    .out(jsonBody[HealthController.AppStatus])
    .serverLogicSuccess(req => startupTime.get.map(t => HealthController.AppStatus(t)))

  def routes: HttpRoutes[F] = Http4sServerInterpreter[F]().toRoutes(statusEndpoint)
}

object HealthController:

  final case class AppStatus(startupTime: Instant) derives Codec.AsObject

  def make[F[_]: Async]: F[HealthController[F]] =
    Temporal[F].realTimeInstant
      .flatMap(ts => Ref.of(ts))
      .map(ref => HealthController[F](ref))
