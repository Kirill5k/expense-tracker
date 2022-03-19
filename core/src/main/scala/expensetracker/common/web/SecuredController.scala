package expensetracker.common.web

import cats.MonadThrow
import cats.effect.{Async, Sync}
import cats.syntax.either.*
import cats.syntax.functor.*
import cats.syntax.applicativeError.*
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.Authenticate
import expensetracker.auth.session.Session
import expensetracker.common.JsonCodecs
import expensetracker.auth.jwt.BearerToken
import expensetracker.common.validations.ColorString
import expensetracker.common.web.ErrorResponse
import org.http4s.HttpRoutes
import sttp.tapir.generic.SchemaDerivation
import sttp.tapir.json.circe.TapirJsonCirce
import sttp.tapir.*
import sttp.model.StatusCode
import sttp.tapir.server.{PartialServerEndpoint, ValuedEndpointOutput}
import sttp.tapir.server.http4s.Http4sServerOptions
import sttp.tapir.server.interceptor.DecodeFailureContext
import sttp.tapir.server.interceptor.exception.{ExceptionContext, ExceptionHandler}

import java.net.InetSocketAddress

trait SecuredController[F[_]] extends TapirJsonCirce with SchemaDerivation with JsonCodecs {

  given Schema[ColorString]    = Schema.string
  given Schema[NonEmptyString] = Schema.string

  private val bearerToken = auth.bearer[String]().map(BearerToken.apply)(_.value)
  private val error       = statusCode.and(jsonBody[ErrorResponse])

  def routes(authenticate: Authenticate => F[Session]): HttpRoutes[F]

  protected def securedEndpoint(
      authenticate: Authenticate => F[Session]
  )(using
      F: MonadThrow[F]
  ): PartialServerEndpoint[BearerToken, Session, Unit, (StatusCode, ErrorResponse), Unit, Any, F] =
    endpoint
      .securityIn(bearerToken)
      .errorOut(error)
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

  protected def serverOptions(using F: Sync[F]): Http4sServerOptions[F, F] = Http4sServerOptions
    .customInterceptors[F, F]
    .exceptionHandler((ctx: ExceptionContext) => Some(ValuedEndpointOutput(error, Controller.mapError(ctx.e))))
    .decodeFailureHandler { (ctx: DecodeFailureContext) =>
      ctx.failure match
        case DecodeResult.Error(_, e) => Some(ValuedEndpointOutput(error, Controller.mapError(e)))
        case _                        => None
    }
    .options
}
