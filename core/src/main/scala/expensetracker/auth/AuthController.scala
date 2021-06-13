package expensetracker.auth

import cats.Monad
import cats.effect.Concurrent
import cats.implicits._
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.MatchesRegex
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.account.{AccountDetails, AccountEmail, AccountName, Password}
import expensetracker.auth.session.Session
import expensetracker.common.web.Controller
import io.circe.generic.auto._
import io.circe.refined._
import org.http4s.{AuthedRoutes, HttpRoutes, ResponseCookie}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.server.{AuthMiddleware, Router}
import org.typelevel.log4cats.Logger

import scala.concurrent.duration._

final class AuthController[F[_]: Logger: Concurrent](
    private val service: AuthService[F]
) extends Controller[F] {
  import AuthController._

  private val prefixPath = "/auth"

  private val routes: HttpRoutes[F] = HttpRoutes.of[F] {
    case req @ POST -> Root / "accounts" =>
      withErrorHandling {
        for {
          create <- req.as[CreateAccountRequest]
          aid    <- service.createAccount(create.accountDetails, create.accountPassword)
          res    <- Created(CreateAccountResponse(aid.value))
        } yield res
      }
    case req @ POST -> Root / "login" =>
      withErrorHandling {
        for {
          login <- req.as[LoginRequest]
          sid   <- service.login(login.accountEmail, login.accountPassword, login.duration)
          res   <- NoContent()
        } yield res.addCookie(ResponseCookie(SessionIdCookie, sid.value))
      }
  }

  private val authedRoutes: AuthedRoutes[Session, F] = AuthedRoutes.of { case POST -> Root / "logout" as session =>
    withErrorHandling {
      service.logout(session.id) *> NoContent()
    }
  }

  def routes(authMiddleware: AuthMiddleware[F, Session]): HttpRoutes[F] =
    Router(
      prefixPath -> authMiddleware(authedRoutes),
      prefixPath -> routes
    )
}

object AuthController {

  type Email = String Refined MatchesRegex["^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\\.[a-zA-Z]+$"]

  final case class CreateAccountRequest(
      email: Email,
      firstName: NonEmptyString,
      lastName: NonEmptyString,
      password: NonEmptyString
  ) {
    def accountDetails: AccountDetails =
      AccountDetails(AccountEmail(email.value), AccountName(firstName.value, lastName.value))

    def accountPassword: Password = Password(password.value)
  }

  final case class CreateAccountResponse(id: String)

  final case class LoginRequest(
      email: Email,
      password: NonEmptyString,
      isExtended: Boolean
  ) {
    def duration: FiniteDuration =
      if (isExtended) 90.days else 1.day

    def accountEmail    = AccountEmail(email.value)
    def accountPassword = Password(password.value)
  }

  def make[F[_]: Concurrent: Logger](service: AuthService[F]): F[AuthController[F]] =
    Monad[F].pure(new AuthController[F](service))
}
