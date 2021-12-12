package expensetracker.auth.session

import cats.data.{Kleisli, OptionT}
import cats.effect.Temporal
import cats.syntax.flatMap.*
import cats.syntax.either.*
import cats.syntax.applicative.*
import cats.syntax.functor.*
import io.circe.generic.auto.*
import expensetracker.common.web.{Controller, ErrorResponse}
import org.bson.types.ObjectId
import org.http4s.{AuthedRoutes, Request}
import org.http4s.circe.CirceEntityCodec.*
import org.http4s.server.AuthMiddleware

import java.time.Instant

object SessionAuthMiddleware {

  def apply[F[_]](
      obtainSession: (SessionId, Option[SessionActivity]) => F[Option[Session]]
  )(using
      F: Temporal[F]
  ): AuthMiddleware[F, Session] = {
    val dsl = new Controller[F] {}; import dsl.*

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
                val currentTime = Instant.ofEpochMilli(time.toMillis)
                val activity    = req.from.map(ip => SessionActivity(ip, currentTime))
                obtainSession(sid, activity).map {
                  case Some(s) if s.active => s.asRight[String]
                  case Some(_)             => "session is inactive".asLeft[Session]
                  case None                => "invalid session-id".asLeft[Session]
                }
              }
          )
      }

    AuthMiddleware(getValidSession, onFailure)
  }
}
