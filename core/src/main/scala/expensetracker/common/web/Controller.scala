package expensetracker.common.web

import cats.MonadError
import cats.syntax.applicativeError.*
import cats.syntax.apply.*
import expensetracker.common.JsonCodecs
import expensetracker.common.errors.AppError
import io.circe.generic.auto.*
import org.http4s.circe.CirceEntityCodec.*
import org.http4s.dsl.Http4sDsl
import org.http4s.*
import org.http4s.headers.`WWW-Authenticate`
import org.typelevel.log4cats.Logger
final case class ErrorResponse(message: String)

trait Controller[F[_]] extends Http4sDsl[F] with JsonCodecs {
  val SessionIdCookie = "session-id"

  private val FailedRegexValidation = "Predicate failed: \"(.*)\"\\.matches\\(.*\\)\\.: DownField\\((.*)\\)".r
  private val NullFieldValidation = "Attempt to decode value on failed cursor: DownField\\((.*)\\)".r
  private val EmptyFieldValidation = "Predicate isEmpty\\(\\) did not fail\\.: DownField\\((.*)\\)".r
  private val IdValidation = "Predicate failed: \\((.*) is valid id\\).: DownField\\((.*)\\)".r

  private val WWWAuthHeader = `WWW-Authenticate`(Challenge("Credentials", "Access to the user data"))

  def routes: HttpRoutes[F]

  protected def withErrorHandling(
      response: => F[Response[F]]
  )(using
      F: MonadError[F, Throwable],
      logger: Logger[F]
  ): F[Response[F]] =
    response.handleErrorWith {
      case err: AppError.Conflict =>
        logger.error(err.getMessage) *>
          Conflict(ErrorResponse(err.getMessage))
      case err: AppError.BadReq =>
        logger.error(err.getMessage) *>
          BadRequest(ErrorResponse(err.getMessage))
      case err: AppError.NotFound =>
        logger.error(err.getMessage) *>
          NotFound(ErrorResponse(err.getMessage))
      case err: AppError.Forbidden =>
        logger.error(err.getMessage) *>
          Forbidden(ErrorResponse(err.getMessage))
      case err: AppError.Unauth =>
        logger.error(err.getMessage) *>
          Unauthorized(WWWAuthHeader, ErrorResponse(err.getMessage))
      case err: InvalidMessageBodyFailure =>
        logger.error(err.getCause())(err.getMessage()) *>
          UnprocessableEntity(ErrorResponse(formatValidationError(err.getCause()).getOrElse(err.message)))
      case err =>
        logger.error(err)(s"unexpected error: ${err.getMessage}") *>
          InternalServerError(ErrorResponse(err.getMessage))
    }

  def getSessionIdCookie(req: Request[F]): Option[RequestCookie] =
    req.cookies.find(_.name == SessionIdCookie)

  protected def sessionIdResponseCookie(token: String): ResponseCookie =
    ResponseCookie(
      SessionIdCookie,
      token,
      httpOnly = true,
      maxAge = Some(Long.MaxValue),
      expires = Some(HttpDate.MaxValue),
      path = Some("/")
    )

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
}
