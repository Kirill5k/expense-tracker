package expensetracker.auth

import cats.Monad
import cats.effect.Temporal
import cats.implicits._
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.MatchesRegex
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.account.{
  Account,
  AccountDetails,
  AccountEmail,
  AccountId,
  AccountName,
  AccountSettings,
  ChangePassword,
  Password
}
import expensetracker.auth.session.{CreateSession, Session}
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.common.errors.AppError.DifferentAccountSession
import expensetracker.common.web.Controller
import io.circe.generic.auto._
import io.circe.refined._
import org.bson.types.ObjectId
import org.http4s.{AuthedRoutes, HttpRoutes}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.server.{AuthMiddleware, Router}
import org.typelevel.log4cats.Logger
import squants.market.Currency

import java.time.Instant

final class AuthController[F[_]: Logger](
    private val service: AuthService[F],
    private val dispatcher: ActionDispatcher[F]
)(implicit
    F: Temporal[F]
) extends Controller[F] {
  import AuthController._

  object AccountIdPath {
    def unapply(cid: String): Option[AccountId] =
      ObjectId.isValid(cid).guard[Option].as(AccountId(cid))
  }

  private val prefixPath = "/auth"

  private val routes: HttpRoutes[F] = HttpRoutes.of[F] {
    case req @ POST -> Root / "account" =>
      withErrorHandling {
        for {
          create <- req.as[CreateAccountRequest]
          aid    <- service.createAccount(create.accountDetails, create.accountPassword)
          _      <- dispatcher.dispatch(Action.SetupNewAccount(aid))
          res    <- Created(CreateAccountResponse(aid.value))
        } yield res
      }
    case req @ POST -> Root / "login" =>
      withErrorHandling {
        for {
          login <- req.as[LoginRequest]
          time  <- Temporal[F].realTime.map(t => Instant.ofEpochMilli(t.toMillis))
          acc   <- service.login(login.accountEmail, login.accountPassword)
          sid   <- service.createSession(CreateSession(acc.id, req.from, time))
          res   <- Ok(AccountView.from(acc))
        } yield res.addCookie(sessionIdResponseCookie(sid.value))
      }
  }

  private val authedRoutes: AuthedRoutes[Session, F] =
    AuthedRoutes.of {
      case GET -> Root / "account" as session =>
        withErrorHandling {
          service.findAccount(session.accountId).map(AccountView.from).flatMap(Ok(_))
        }
      case authedReq @ PUT -> Root / "account" / AccountIdPath(id) / "settings" as session =>
        withErrorHandling {
          for {
            _   <- F.ensure(id.pure[F])(DifferentAccountSession)(_ == session.accountId)
            req <- authedReq.req.as[UpdateAccountSettingsRequest]
            _   <- service.updateSettings(id, req.toDomain)
            res <- NoContent()
          } yield res
        }
      case authedReq @ POST -> Root / "account" / AccountIdPath(id) / "password" as session =>
        withErrorHandling {
          for {
            _    <- F.ensure(id.pure[F])(DifferentAccountSession)(_ == session.accountId)
            req  <- authedReq.req.as[ChangePasswordRequest]
            _    <- service.changePassword(req.toDomain(id))
            time <- Temporal[F].realTime.map(t => Instant.ofEpochMilli(t.toMillis))
            sid  <- service.createSession(CreateSession(id, authedReq.req.from, time))
            res  <- NoContent()
          } yield res.addCookie(sessionIdResponseCookie(sid.value))
        }
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

object AuthController {

  type Email = String Refined MatchesRegex["^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\\.[a-zA-Z]+$"]

  final case class CreateAccountRequest(
      email: Email,
      firstName: NonEmptyString,
      lastName: NonEmptyString,
      password: NonEmptyString
  ) {
    def accountDetails: AccountDetails =
      AccountDetails(AccountEmail(email.value.toLowerCase), AccountName(firstName.value, lastName.value))

    def accountPassword: Password = Password(password.value)
  }

  final case class CreateAccountResponse(id: String)

  final case class LoginRequest(
      email: Email,
      password: NonEmptyString
  ) {
    def accountEmail    = AccountEmail(email.value.toLowerCase)
    def accountPassword = Password(password.value)
  }

  final case class AccountView(
      id: String,
      firstName: String,
      lastName: String,
      email: String,
      settings: AccountSettings,
      registrationDate: Instant
  )

  object AccountView {
    def from(acc: Account): AccountView =
      AccountView(
        acc.id.value,
        acc.name.first,
        acc.name.last,
        acc.email.value,
        acc.settings,
        acc.registrationDate
      )
  }

  final case class UpdateAccountSettingsRequest(
      currency: Currency,
      hideFutureTransactions: Boolean,
      darkMode: Option[Boolean]
  ) {
    def toDomain: AccountSettings =
      AccountSettings(
        currency,
        hideFutureTransactions = hideFutureTransactions,
        darkMode = darkMode
      )
  }

  final case class ChangePasswordRequest(
      currentPassword: NonEmptyString,
      newPassword: NonEmptyString
  ) {
    def toDomain(id: AccountId): ChangePassword =
      ChangePassword(id, Password(currentPassword.value), Password(newPassword.value))
  }

  def make[F[_]: Temporal: Logger](service: AuthService[F], dispatcher: ActionDispatcher[F]): F[AuthController[F]] =
    Monad[F].pure(new AuthController[F](service, dispatcher))
}
