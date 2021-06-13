package expensetracker.auth.session

import cats.data.{Kleisli, OptionT}
import cats.effect.Temporal
import cats.implicits._
import io.circe.generic.auto._
import expensetracker.common.web.{Controller, ErrorResponse}
import org.bson.types.ObjectId
import org.http4s.{AuthedRoutes, Request}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.server.AuthMiddleware

object SessionAuthMiddleware {

  def apply[F[_]](
      obtainSession: SessionId => F[Option[Session]]
  )(implicit
      F: Temporal[F]
  ): AuthMiddleware[F, Session] = {
    val dsl = new Controller[F] {}; import dsl._

    val onFailure: AuthedRoutes[String, F] =
      Kleisli(req => OptionT.liftF(Forbidden(ErrorResponse(req.context)).map(_.removeCookie(SessionIdCookie))))

    val getValidSession: Kleisli[F, Request[F], Either[String, Session]] =
      Kleisli { req =>
        getSessionIdCookie(req)
          .toRight("missing session-id cookie")
          .map(_.content)
          .flatMap(sid => if (ObjectId.isValid(sid)) Right(SessionId(sid)) else Left("invalid session-id format"))
          .fold(
            _.asLeft[Session].pure[F],
            sid =>
              F.realTime.flatMap { time =>
                obtainSession(sid).map {
                  case None                                                => "invalid session-id".asLeft[Session]
                  case Some(s) if time.toMillis > s.expiresAt.toEpochMilli => "session has expired".asLeft[Session]
                  case Some(s)                                             => s.asRight[String]
                }
              }
          )
      }

    AuthMiddleware(getValidSession, onFailure)
  }
}
