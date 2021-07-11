package expensetracker.common.web

import cats.MonadError
import cats.implicits._
import expensetracker.common.JsonCodecs
import expensetracker.common.errors.{AppError}
import io.circe.generic.auto._
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.Http4sDsl
import org.http4s._
import org.http4s.headers.`WWW-Authenticate`
import org.typelevel.log4cats.Logger

final case class ErrorResponse(message: String)

trait Controller[F[_]] extends Http4sDsl[F] with JsonCodecs {
  val SessionIdCookie = "session-id"

  private val WWWAuthHeader = `WWW-Authenticate`(Challenge("Credentials", "Access to the user data"))

  protected def withErrorHandling(
      response: => F[Response[F]]
  )(implicit
      F: MonadError[F, Throwable],
      logger: Logger[F]
  ): F[Response[F]] =
    response.handleErrorWith {
      case err: AppError.Conflict =>
        logger.error(err)(err.getMessage) *>
          Conflict(ErrorResponse(err.getMessage))
      case err: AppError.BadReq =>
        logger.error(err)(err.getMessage) *>
          BadRequest(ErrorResponse(err.getMessage))
      case err: AppError.NotFound =>
        logger.error(err)(err.getMessage) *>
          NotFound(ErrorResponse(err.getMessage))
      case err: AppError.Forbidden =>
        logger.error(err.getMessage) *>
          Forbidden(ErrorResponse(err.getMessage))
      case err: AppError.Unauth =>
        logger.error(err.getMessage) *>
          Unauthorized(WWWAuthHeader, ErrorResponse(err.getMessage))
      case err: InvalidMessageBodyFailure =>
        logger.error(err.getCause())(err.getMessage()) *>
          UnprocessableEntity(
            ErrorResponse(
              err
                .getCause()
                .getMessage
                .replaceAll("Predicate", "Validation")
                .replaceAll("DownField", "Field")
            )
          )
      case err =>
        logger.error(err)(s"unexpected error: ${err.getMessage}") *>
          InternalServerError(ErrorResponse(err.getMessage))
    }

  def getSessionIdCookie(req: Request[F]): Option[RequestCookie] =
    req.cookies
      .find(_.name == SessionIdCookie)

  protected def sessionIdResponseCookie(token: String): ResponseCookie =
    ResponseCookie(
      SessionIdCookie,
      token,
      httpOnly = true,
      maxAge = Some(Long.MaxValue),
      expires = Some(HttpDate.MaxValue),
      path = Some("/")
    )
}
