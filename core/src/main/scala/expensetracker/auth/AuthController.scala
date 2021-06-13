package expensetracker.auth

import cats.effect.Concurrent
import cats.implicits._
import expensetracker.auth.account.{AccountDetails, AccountEmail, AccountName, Password}
import expensetracker.auth.session.Session
import expensetracker.common.web.Controller
import io.circe.generic.auto._
import org.http4s.{AuthedRoutes, HttpRoutes, ResponseCookie}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.server.{AuthMiddleware, Router}
import org.typelevel.log4cats.Logger

import scala.concurrent.duration._

final case class CreateAccountRequest(
    email: String,
    firstName: String,
    lastName: String,
    password: String
) {
  def accountDetails: AccountDetails =
    AccountDetails(AccountEmail(email), AccountName(firstName, lastName))

  def accountPassword: Password = Password(password)
}
final case class CreateAccountResponse(accountId: String)

final case class LoginRequest(
    email: String,
    password: String,
    isExtended: Boolean
) {
  def duration: FiniteDuration =
    if (isExtended) 1.day else 90.days
}

final class AuthController[F[_]: Logger: Concurrent](
    private val service: AuthService[F]
) extends Controller[F] {

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
          sid   <- service.login(AccountEmail(login.email), Password(login.password), login.duration)
          res   <- NoContent()
        } yield res.addCookie(ResponseCookie(SessionIdCookie, sid.value, httpOnly = true))
      }
  }

  private val authedRoutes: AuthedRoutes[Session, F] = AuthedRoutes.of {
    case POST -> Root / "logout" as session =>
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
