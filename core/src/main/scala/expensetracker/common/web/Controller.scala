package expensetracker.common.web

import cats.MonadError
import cats.syntax.applicativeError.*
import cats.syntax.apply.*
import expensetracker.common.JsonCodecs
import expensetracker.common.errors.AppError
import io.circe.Codec
import org.http4s.circe.CirceEntityCodec.*
import org.http4s.dsl.Http4sDsl
import org.http4s.*
import org.http4s.headers.`WWW-Authenticate`
import org.typelevel.log4cats.Logger
import sttp.model.StatusCode

final case class ErrorResponse(message: String) derives Codec.AsObject

trait Controller[F[_]] extends Http4sDsl[F] with JsonCodecs {
  import Controller.*

  protected def withErrorHandling(
      response: => F[Response[F]]
  )(using
      F: MonadError[F, Throwable],
      logger: Logger[F]
  ): F[Response[F]] =
    response.handleErrorWith { error =>
      val (statusCode, errorResponse) = mapError(error)
      logger.error(errorResponse.message) *> (statusCode match
        case StatusCode.Conflict            => Conflict(errorResponse)
        case StatusCode.BadRequest          => BadRequest(errorResponse)
        case StatusCode.NotFound            => NotFound(errorResponse)
        case StatusCode.Forbidden           => Forbidden(errorResponse)
        case StatusCode.Unauthorized        => Unauthorized(WWWAuthHeader, errorResponse)
        case StatusCode.UnprocessableEntity => UnprocessableEntity(errorResponse)
        case _                              => InternalServerError(errorResponse)
      )
    }
}

object Controller {
  private val FailedRegexValidation = "Predicate failed: \"(.*)\"\\.matches\\(.*\\)\\.: DownField\\((.*)\\)".r
  private val NullFieldValidation   = "Attempt to decode value on failed cursor: DownField\\((.*)\\)".r
  private val EmptyFieldValidation  = "Predicate isEmpty\\(\\) did not fail\\.: DownField\\((.*)\\)".r
  private val IdValidation          = "Predicate failed: \\((.*) is valid id\\).: DownField\\((.*)\\)".r

  private val WWWAuthHeader = `WWW-Authenticate`(Challenge("Credentials", "Access to the user data"))

  private def formatValidationError(cause: Throwable): Option[String] =
    cause.getMessage match {
      case IdValidation(value, field) =>
        Some(s"$value is not a valid $field")
      case EmptyFieldValidation(field) =>
        Some(s"${field.capitalize} must not be empty")
      case NullFieldValidation(field) =>
        Some(s"${field.capitalize} is required")
      case FailedRegexValidation(value, field) =>
        Some(s"$value is not a valid $field")
      case s if s.contains("DownField") =>
        s.split(": DownField").headOption.map(_.capitalize)
      case _ =>
        None
    }

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
      case err: InvalidMessageBodyFailure =>
        (StatusCode.UnprocessableEntity, ErrorResponse(formatValidationError(err.getCause()).getOrElse(err.message)))
      case err =>
        (StatusCode.InternalServerError, ErrorResponse(err.getMessage))
    }
}
