package expensetracker.common.web

import cats.MonadError
import cats.implicits._
import expensetracker.auth.session.SessionId
import io.circe.generic.auto._
import expensetracker.common.errors.{AuthError, BadRequestError}
import org.http4s.{Request, Response}
import org.http4s.dsl.Http4sDsl
import org.typelevel.log4cats.Logger
import org.http4s.circe.CirceEntityCodec._

trait Controller[F[_]] extends Http4sDsl[F] {
  final case class ErrorResponse(message: String)

  val SessionIdCookie = "session-id"

  protected def withErrorHandling(
      response: => F[Response[F]]
  )(implicit
      F: MonadError[F, Throwable],
      logger: Logger[F]
  ): F[Response[F]] =
    response.handleErrorWith {
      case err: BadRequestError =>
        logger.error(err)(err.getMessage) *>
          BadRequest(ErrorResponse(err.getMessage))
      case err: AuthError =>
        logger.error(err)(err.getMessage) *>
          Forbidden(ErrorResponse(err.getMessage))
      case err =>
        logger.error(err)(s"unexpected error: ${err.getMessage}") *>
          InternalServerError(ErrorResponse(err.getMessage))
    }

  def getSessionIdFromCookie(req: Request[F]): Option[SessionId] =
    req.cookies.find(_.name == SessionIdCookie).map(c => SessionId(c.content))
}
