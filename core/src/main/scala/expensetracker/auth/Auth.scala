package expensetracker.auth

import cats.effect.{Async, Temporal}
import cats.implicits._
import expensetracker.Resources
import expensetracker.auth.user.{UserService, PasswordEncryptor}
import expensetracker.auth.user.db.UserRepository
import expensetracker.auth.session.db.SessionRepository
import expensetracker.auth.session.{Session, SessionAuthMiddleware, SessionService}
import expensetracker.common.actions.ActionDispatcher
import expensetracker.common.config.AuthConfig
import org.http4s.HttpRoutes
import org.http4s.server.AuthMiddleware
import org.typelevel.log4cats.Logger

final class Auth[F[_]: Temporal] private (
    private val authService: AuthService[F],
    private val authController: AuthController[F]
) {
  val sessionAuthMiddleware: AuthMiddleware[F, Session] = SessionAuthMiddleware[F](authService.findSession)

  def routes(authMiddleware: AuthMiddleware[F, Session]): HttpRoutes[F] = authController.routes(authMiddleware)
}

object Auth {
  def make[F[_]: Async: Logger](config: AuthConfig, resources: Resources[F], dispatcher: ActionDispatcher[F]): F[Auth[F]] =
    for {
      sessRepo <- SessionRepository.make[F](resources.mongo)
      sessSvc  <- SessionService.make[F](sessRepo)
      accRepo  <- UserRepository.make[F](resources.mongo)
      encr     <- PasswordEncryptor.make[F](config)
      accSvc   <- UserService.make[F](accRepo, encr)
      authSvc  <- AuthService.make[F](accSvc, sessSvc)
      authCtrl <- AuthController.make[F](authSvc, dispatcher)
    } yield new Auth[F](authSvc, authCtrl)
}
