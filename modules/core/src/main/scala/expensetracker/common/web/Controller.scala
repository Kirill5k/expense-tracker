package expensetracker.common.web

import cats.MonadThrow
import cats.effect.Async
import cats.syntax.either.*
import cats.syntax.functor.*
import cats.syntax.applicativeError.*
import expensetracker.auth.Authenticator
import expensetracker.auth.session.Session
import expensetracker.auth.jwt.BearerToken
import expensetracker.common.errors.AppError
import kirill5k.common.syntax.time.*
import io.circe.Codec
import mongo4cats.bson.ObjectId
import org.http4s.HttpRoutes
import sttp.tapir.*
import sttp.tapir.Codec as TapirCodec
import sttp.model.StatusCode
import sttp.tapir.Codec.PlainCodec
import sttp.tapir.DecodeResult.Error.JsonDecodeException
import sttp.tapir.server.PartialServerEndpoint
import sttp.tapir.server.http4s.{Http4sServerInterpreter, Http4sServerOptions}
import sttp.tapir.server.interceptor.DecodeFailureContext
import sttp.tapir.server.interceptor.exception.{ExceptionContext, ExceptionHandler}
import sttp.tapir.server.model.ValuedEndpointOutput
import sttp.tapir.server.interceptor.decodefailure.DecodeFailureHandler

import java.time.Instant

final case class ErrorResponse(message: String) derives Codec.AsObject

trait Controller[F[_]] extends TapirJson with TapirSchema {

  def routes(using authenticator: Authenticator[F]): HttpRoutes[F]

  extension [A](fa: F[A])(using F: MonadThrow[F])
    def voidResponse: F[Either[(StatusCode, ErrorResponse), Unit]] = mapResponse(_ => ())
    def mapResponse[B](fab: A => B): F[Either[(StatusCode, ErrorResponse), B]] =
      fa
        .map(fab(_).asRight[(StatusCode, ErrorResponse)])
        .handleError(e => Controller.mapError(e).asLeft[B])

  extension [I, O](se: Endpoint[BearerToken, I, (StatusCode, ErrorResponse), O, Any])
    def withAuthenticatedSession(using
        F: MonadThrow[F],
        auth: Authenticator[F]
    ): PartialServerEndpoint[BearerToken, Session, I, (StatusCode, ErrorResponse), O, Any, F] =
      se.serverSecurityLogic(t => auth.authenticate(t).mapResponse(identity))
}

object Controller extends TapirSchema with TapirJson {
  inline given instantCodec: PlainCodec[Instant] =
    TapirCodec.string.mapDecode(d => d.toInstant.fold(DecodeResult.Error(d, _), DecodeResult.Value(_)))(_.toString)

  val validId: Validator[String] = Validator.custom(
    id =>
      if (ObjectId.isValid(id)) ValidationResult.Valid else ValidationResult.Invalid(s"Invalid hexadecimal representation of an id: $id"),
    Some(s"Invalid hexadecimal representation of an id")
  )

  private val error = statusCode.and(jsonBody[ErrorResponse])

  val publicEndpoint: PublicEndpoint[Unit, (StatusCode, ErrorResponse), Unit, Any] =
    endpoint.errorOut(error)

  val securedEndpoint: Endpoint[BearerToken, Unit, (StatusCode, ErrorResponse), Unit, Any] =
    publicEndpoint.securityIn(auth.bearer[String]().validate(Validator.nonEmptyString).map(BearerToken.apply)(_.value))

  def serverInterpreter[F[_]](using F: Async[F]): Http4sServerInterpreter[F] =
    Http4sServerInterpreter[F] {
      val errorEndpointOut = (e: Throwable) => Some(ValuedEndpointOutput(error, Controller.mapError(e)))
      Http4sServerOptions
        .customiseInterceptors[F]
        .exceptionHandler(ExceptionHandler.pure((ctx: ExceptionContext) => errorEndpointOut(ctx.e)))
        .decodeFailureHandler(DecodeFailureHandler.pure { (ctx: DecodeFailureContext) =>
          if (ctx.failingInput.toString.matches("Header.Authorization.*")) {
            ctx.failure match
              case DecodeResult.Error(_, e)     => errorEndpointOut(AppError.InvalidAuthorizationHeader(e.getMessage.trim))
              case DecodeResult.Missing         => errorEndpointOut(AppError.MissingAuthorizationHeader)
              case DecodeResult.InvalidValue(_) => errorEndpointOut(AppError.InvalidBearerToken)
              case _                            => None
          } else {
            ctx.failure match
              case DecodeResult.Error(_, e) => errorEndpointOut(e)
              case DecodeResult.InvalidValue(e) =>
                val msgs = e.flatMap(_.customMessage)
                errorEndpointOut(AppError.FailedValidation(msgs.mkString(", ")))
              case _ => None
          }
        })
        .options
    }

  private val FailedRegexValidation  = "Predicate failed: \"(.*)\"\\.matches\\(.*\\)\\.".r
  private val MissingFieldValidation = "Missing required field".r
  private val PositiveIntValidation  = "Predicate failed: \\((.*) > 0\\)\\.".r
  private val EmptyFieldValidation   = "Predicate isEmpty\\(\\) did not fail\\.".r
  private val IdValidation           = "Predicate failed: \\((.*) is valid id\\).".r

  private def formatJsonError(err: JsonDecodeException): String =
    err.errors
      .map { je =>
        je.msg match
          case PositiveIntValidation(value) => s"$value is smaller than 1"
          case FailedRegexValidation(value) => s"$value is not a valid ${je.path.head.name}"
          case MissingFieldValidation()     => s"${je.path.head.name} is required"
          case EmptyFieldValidation()       => s"${je.path.head.name} must not be empty"
          case IdValidation(value)          => s"$value is not a valid ${je.path.head.name}"
          case msg if je.path.isEmpty       => s"Invalid message body: Could not decode $msg json"
          case msg                          => msg
      }
      .mkString(", ")

  def mapError(error: Throwable): (StatusCode, ErrorResponse) =
    error match {
      case err: AppError.Conflict =>
        (StatusCode.Conflict, ErrorResponse(err.getMessage))
      case err: AppError.BadReq =>
        (StatusCode.BadRequest, ErrorResponse(err.getMessage))
      case err: AppError.NotFound =>
        (StatusCode.NotFound, ErrorResponse(err.getMessage))
      case err: AppError.Forbidden =>
        (StatusCode.Forbidden, ErrorResponse(err.getMessage))
      case err: AppError.Unauth =>
        (StatusCode.Unauthorized, ErrorResponse(err.getMessage))
      case err: AppError.Unprocessable =>
        (StatusCode.UnprocessableEntity, ErrorResponse(err.getMessage))
      case err: JsonDecodeException =>
        (StatusCode.UnprocessableEntity, ErrorResponse(formatJsonError(err)))
      case err =>
        (StatusCode.InternalServerError, ErrorResponse(err.getMessage))
    }
}
