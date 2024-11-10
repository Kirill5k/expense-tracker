package expensetracker.wellknown

import cats.effect.Async
import expensetracker.auth.Authenticator
import expensetracker.common.config.WellKnownConfig
import expensetracker.common.web.{Controller, TapirJson, TapirSchema}
import org.http4s.HttpRoutes
import sttp.capabilities.fs2.Fs2Streams
import sttp.tapir.*
import sttp.tapir.server.ServerEndpoint
import sttp.tapir.server.http4s.Http4sServerInterpreter

final class WellKnownController[F[_]: Async](
    private val config: WellKnownConfig
) extends Controller[F] {

  private val statusEndpoint: ServerEndpoint[Fs2Streams[F], F] =
    WellKnownController.aasaEndpoint
      .serverLogicPure { _ =>
        Right(
          s"""
             |{
             |  "applinks": {
             |    "apps": [],
             |    "details": [
             |      {
             |        "appID": "${config.apple.developerId}.${config.apple.bundleId}",
             |        "paths": ["/"]
             |      }
             |    ]
             |  },
             |  "activitycontinuation": {
             |    "apps": ["${config.apple.developerId}.${config.apple.bundleId}"]
             |  },
             |  "webcredentials": {
             |    "apps": ["${config.apple.developerId}.${config.apple.bundleId}"]
             |  }
             |}
             |""".stripMargin)
      }

  def routes(using auth: Authenticator[F]): HttpRoutes[F] = Http4sServerInterpreter[F]().toRoutes(statusEndpoint)
}

object WellKnownController extends TapirSchema with TapirJson {

  val basePath = ".well-known"

  val aasaEndpoint = infallibleEndpoint.get
    .in(basePath / "apple-app-site-association")
    .out(jsonBody[String])
    .out(header("Content-Type", "application/json"))

  def make[F[_]](config: WellKnownConfig)(using F: Async[F]): F[Controller[F]] =
    F.pure(WellKnownController[F](config))
}
