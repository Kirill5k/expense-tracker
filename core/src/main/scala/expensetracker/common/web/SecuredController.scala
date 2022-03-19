package expensetracker.common.web

import cats.{ApplicativeThrow, MonadThrow}
import cats.effect.Async
import cats.syntax.either.*
import cats.syntax.functor.*
import cats.syntax.applicativeError.*
import expensetracker.auth.Authenticate
import expensetracker.auth.session.Session
import expensetracker.common.JsonCodecs
import expensetracker.auth.jwt.BearerToken
import expensetracker.common.web.ErrorResponse
import org.http4s.HttpRoutes
import sttp.tapir.generic.SchemaDerivation
import sttp.tapir.json.circe.TapirJsonCirce
import sttp.tapir.*
import sttp.model.StatusCode
import sttp.tapir.server.PartialServerEndpoint

import java.net.InetSocketAddress

trait SecuredController[F[_]] extends TapirJsonCirce with SchemaDerivation with JsonCodecs {

  private val bearerToken = auth.bearer[String]().map(BearerToken.apply)(_.value)

  def routes(authenticate: Authenticate => F[Session]): HttpRoutes[F]

  protected def securedEndpoint(
      authenticate: Authenticate => F[Session]
  )(using
      F: ApplicativeThrow[F]
  ): PartialServerEndpoint[BearerToken, Session, Unit, (StatusCode, ErrorResponse), Unit, Any, F] =
    endpoint
      .securityIn(bearerToken)
      .errorOut(statusCode.and(jsonBody[ErrorResponse]))
      .serverSecurityLogic { token =>
        authenticate(Authenticate(token))
          .map(_.asRight[(StatusCode, ErrorResponse)])
          .handleError(e => Controller.mapError(e).asLeft[Session])
      }

  extension [A](fa: F[A])(using F: MonadThrow[F])
    def mapResponse[B](fab: A => B): F[Either[(StatusCode, ErrorResponse), B]] =
      fa
        .map(fab(_).asRight[(StatusCode, ErrorResponse)])
        .handleError(e => Controller.mapError(e).asLeft[B])
}
