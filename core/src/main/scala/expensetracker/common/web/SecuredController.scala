package expensetracker.common.web

import cats.effect.Async
import cats.syntax.either.*
import cats.syntax.functor.*
import cats.syntax.applicativeError.*
import expensetracker.auth.session.Session
import expensetracker.common.JsonCodecs
import expensetracker.auth.jwt.BearerToken
import expensetracker.common.web.ErrorResponse
import sttp.tapir.generic.SchemaDerivation
import sttp.tapir.json.circe.TapirJsonCirce
import sttp.tapir.*
import sttp.model.StatusCode
import sttp.tapir.server.PartialServerEndpoint

import java.net.InetSocketAddress

final case class RequestInfo(from: Option[InetSocketAddress])

trait SecuredController[F[_]] extends TapirJsonCirce with SchemaDerivation with JsonCodecs {

  def service: FooService[F]

  private val bearerToken = auth.bearer[String]().map(BearerToken.apply)(_.value)
  private val requestInfo = extractFromRequest(req => RequestInfo(req.connectionInfo.remote))

  protected def securedEndpoint(using F: Async[F]): PartialServerEndpoint[(BearerToken, RequestInfo), Session, Unit, (StatusCode, ErrorResponse), Unit, Any, F] =
    endpoint
      .securityIn(bearerToken.and(requestInfo))
      .errorOut(statusCode.and(jsonBody[ErrorResponse]))
      .serverSecurityLogic { (token, info) =>
        service
          .findSession(token, info)
          .map(_.asRight[(StatusCode, ErrorResponse)])
          .handleError(e => Controller.mapError(e).asLeft[Session])
      }

}

trait FooService[F[_]] {
  def findSession(token: BearerToken, info: RequestInfo): F[Session]
}