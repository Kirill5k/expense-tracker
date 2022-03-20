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
import expensetracker.common.errors.AppError
import expensetracker.common.validations.{ColorString, EmailString, IdString}
import expensetracker.common.web.ErrorResponse
import org.http4s.HttpRoutes
import squants.Money
import squants.market.Currency
import sttp.tapir.generic.SchemaDerivation
import sttp.tapir.json.circe.TapirJsonCirce
import sttp.tapir.*
import sttp.model.{HeaderNames, StatusCode}
import sttp.tapir.EndpointIO.Header
import sttp.tapir.server.{PartialServerEndpoint, ValuedEndpointOutput}
import sttp.tapir.server.http4s.Http4sServerOptions
import sttp.tapir.server.interceptor.DecodeFailureContext
import sttp.tapir.server.interceptor.exception.{ExceptionContext, ExceptionHandler}

trait SecuredController[F[_]] extends TapirJsonCirce with SchemaDerivation with JsonCodecs {

  given Schema[IdString]       = Schema.string
  given Schema[ColorString]    = Schema.string
  given Schema[NonEmptyString] = Schema.string
  given Schema[EmailString]    = Schema.string
  // TODO: add schema
  given Schema[Money]    = Schema.string
  given Schema[Currency] = Schema.string

  private val bearerToken = auth.bearer[String]().validate(Validator.nonEmptyString).map(BearerToken.apply)(_.value)
  private val error       = statusCode.and(jsonBody[ErrorResponse])

  def routes(authenticate: Authenticate => F[Session]): HttpRoutes[F]

  protected def securedEndpoint(
      auth: Authenticate => F[Session]
  )(using
      F: MonadThrow[F]
  ): PartialServerEndpoint[BearerToken, Session, Unit, (StatusCode, ErrorResponse), Unit, Any, F] =
    endpoint
      .securityIn(bearerToken)
      .errorOut(error)
      .serverSecurityLogic(t => auth(Authenticate(t)).mapResponse(identity))

  protected def publicEndpoint: PublicEndpoint[Unit, (StatusCode, ErrorResponse), Unit, Any] =
    endpoint.errorOut(error)

  extension [A](fa: F[A])(using F: MonadThrow[F])
    def voidResponse: F[Either[(StatusCode, ErrorResponse), Unit]] = mapResponse(_ => ())
    def mapResponse[B](fab: A => B): F[Either[(StatusCode, ErrorResponse), B]] =
      fa
        .map(fab(_).asRight[(StatusCode, ErrorResponse)])
        .handleError(e => Controller.mapError(e).asLeft[B])

  protected def serverOptions(using F: Sync[F]): Http4sServerOptions[F, F] = Http4sServerOptions
    .customInterceptors[F, F]
    .exceptionHandler((ctx: ExceptionContext) => errorEndpointOut(ctx.e))
    .decodeFailureHandler { (ctx: DecodeFailureContext) =>
      if (ctx.failingInput.toString.matches("Header.Authorization.*")) {
        ctx.failure match
          case DecodeResult.Error(_, e)     => errorEndpointOut(AppError.InvalidAuthorizationHeader(e.getMessage.trim))
          case DecodeResult.Missing         => errorEndpointOut(AppError.MissingAuthorizationHeader)
          case DecodeResult.InvalidValue(_) => errorEndpointOut(AppError.InvalidBearerToken)
          case _                            => None
      } else {
        ctx.failure match
          case DecodeResult.Error(_, e) => errorEndpointOut(e)
          case _                        => None
      }
    }
    .options

  private val errorEndpointOut = (e: Throwable) => Some(ValuedEndpointOutput(error, Controller.mapError(e)))
}
