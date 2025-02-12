package expensetracker.wellknown

import cats.effect.Async
import io.circe.Codec
import expensetracker.auth.Authenticator
import expensetracker.common.config.WellKnownConfig
import expensetracker.common.web.{Controller, TapirJson, TapirSchema}
import expensetracker.wellknown.WellKnownController.*
import org.http4s.HttpRoutes
import sttp.capabilities.fs2.Fs2Streams
import sttp.tapir.*
import sttp.tapir.server.ServerEndpoint
import sttp.tapir.server.http4s.Http4sServerInterpreter

final class WellKnownController[F[_]: Async](
    private val config: WellKnownConfig
) extends Controller[F] {

  private val appleAppSiteAssociation = AppleAppSiteAssociation(
    applinks = AasaAppLinks(
      apps = Nil,
      details = List(
        AasaAppLinksDetails(
          appID = s"${config.apple.developerId}.${config.apple.bundleId}",
          paths = List("/")
        )
      )
    ),
    activitycontinuation = AasaActivityContinuation(
      apps = List(s"${config.apple.developerId}.${config.apple.bundleId}")
    ),
    webcredentials = AasaWebCredentials(
      apps = List(s"${config.apple.developerId}.${config.apple.bundleId}")
    )
  )
  
  private val statusEndpoint: ServerEndpoint[Fs2Streams[F], F] =
    WellKnownController.aasaEndpoint.serverLogicPure(_ => Right(appleAppSiteAssociation))

  def routes(using auth: Authenticator[F]): HttpRoutes[F] = Http4sServerInterpreter[F]().toRoutes(statusEndpoint)
}

object WellKnownController extends TapirSchema with TapirJson {

  val basePath = ".well-known"

  final case class AasaAppLinksDetails(
      appID: String,
      paths: List[String]
  ) derives Codec.AsObject

  final case class AasaAppLinks(
      apps: List[String],
      details: List[AasaAppLinksDetails]
  ) derives Codec.AsObject

  final case class AasaActivityContinuation(
      apps: List[String]
  ) derives Codec.AsObject

  final case class AasaWebCredentials(
      apps: List[String]
  ) derives Codec.AsObject

  final case class AppleAppSiteAssociation(
      applinks: AasaAppLinks,
      activitycontinuation: AasaActivityContinuation,
      webcredentials: AasaWebCredentials
  ) derives Codec.AsObject

  val aasaEndpoint = infallibleEndpoint.get
    .in(basePath / "apple-app-site-association")
    .out(jsonBody[AppleAppSiteAssociation])
    .out(header("Content-Type", "application/json"))

  def make[F[_]](config: WellKnownConfig)(using F: Async[F]): F[Controller[F]] =
    F.pure(WellKnownController[F](config))
}
