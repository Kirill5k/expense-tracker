package expensetracker.auth.session

import cats.MonadError
import cats.data.{Kleisli, OptionT}
import cats.implicits._
import org.http4s.{AuthedRoutes, Request}
import org.http4s.dsl.Http4sDsl
import org.http4s.server.AuthMiddleware

object SessionAuthMiddleware {

  def apply[F[_]](
      obtainSession: SessionId => F[Option[Session]]
  )(implicit
      F: MonadError[F, Throwable]
  ): AuthMiddleware[F, Session] = {
    val dsl = new Http4sDsl[F] {}; import dsl._

    val onFailure: AuthedRoutes[String, F] =
      Kleisli(req => OptionT.liftF(Forbidden(req.context)))

    val getSession: Kleisli[F, Request[F], Either[String, Session]] =
      Kleisli { req =>
        req.cookies
          .find(_.name == "session-id")
          .map(c => SessionId(c.content))
          .fold("missing session-id cookie".asLeft[Session].pure[F]) { sid =>
            obtainSession(sid).map {
              case None                    => "invalid session-id".asLeft[Session]
              case Some(s) if s.hasExpired => "session has expired".asLeft[Session]
              case Some(s)                 => s.asRight[String]
            }
          }
      }

    AuthMiddleware(getSession, onFailure)
  }
}
