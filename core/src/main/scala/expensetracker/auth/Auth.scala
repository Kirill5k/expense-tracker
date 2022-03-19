package expensetracker.auth

import cats.effect.{Async, Temporal}
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.Resources
import expensetracker.auth.user.{PasswordEncryptor, UserService}
import expensetracker.auth.user.db.UserRepository
import expensetracker.auth.session.db.SessionRepository
import expensetracker.auth.session.{Session, SessionAuth, SessionService}
import expensetracker.common.actions.ActionDispatcher
import expensetracker.common.config.AuthConfig
import jwt.JwtEncoder
import org.http4s.HttpRoutes
import org.http4s.server.AuthMiddleware
import org.typelevel.log4cats.Logger

final class Auth[F[_]: Temporal] private (
    private val authService: AuthService[F],
    private val authController: AuthController[F]
) {
  val sessionAuthMiddleware: AuthMiddleware[F, Session] = SessionAuth.middleware[F](authService.findSession)

  def routes(authMiddleware: AuthMiddleware[F, Session]): HttpRoutes[F] = authController.routes(authMiddleware)
}

object Auth {
  def make[F[_]: Async: Logger](config: AuthConfig, resources: Resources[F], dispatcher: ActionDispatcher[F]): F[Auth[F]] =
    for {
      sessRepo <- SessionRepository.make[F](resources.mongo)
      jwtEnc   <- JwtEncoder.circeJwtEncoder[F](config.jwt)
      sessSvc  <- SessionService.make[F](jwtEnc, sessRepo)
      accRepo  <- UserRepository.make[F](resources.mongo)
      encr     <- PasswordEncryptor.make[F](config)
      accSvc   <- UserService.make[F](accRepo, encr)
      authSvc  <- AuthService.make[F](accSvc, sessSvc)
      authCtrl <- AuthController.make[F](authSvc, dispatcher, jwtEnc)
    } yield Auth[F](authSvc, authCtrl)
}
