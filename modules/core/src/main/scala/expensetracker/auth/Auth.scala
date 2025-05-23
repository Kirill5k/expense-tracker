package expensetracker.auth

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.Resources
import expensetracker.auth.user.{PasswordEncryptor, UserService}
import expensetracker.auth.user.db.UserRepository
import expensetracker.auth.session.db.SessionRepository
import expensetracker.auth.session.SessionService
import expensetracker.common.actions.ActionDispatcher
import expensetracker.common.config.AuthConfig
import expensetracker.common.web.Controller
import jwt.JwtEncoder

final class Auth[F[_]] private (
    val userService: UserService[F],
    val authenticator: Authenticator[F],
    val controller: Controller[F]
)

object Auth:
  def make[F[_]: Async](config: AuthConfig, resources: Resources[F], dispatcher: ActionDispatcher[F]): F[Auth[F]] =
    for
      sessRepo <- SessionRepository.make[F](resources.mongoDb)
      jwtEnc   <- JwtEncoder.circeJwtEncoder[F](config.jwt)
      sessSvc  <- SessionService.make[F](jwtEnc, sessRepo)
      accRepo  <- UserRepository.make[F](resources.mongoDb)
      encr     <- PasswordEncryptor.make[F](config)
      usrSvc   <- UserService.make[F](accRepo, encr, dispatcher)
      authCtrl <- AuthController.make[F](usrSvc, sessSvc)
    yield Auth[F](usrSvc, sessSvc.authenticate(_), authCtrl)
