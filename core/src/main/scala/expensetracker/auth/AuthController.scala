package expensetracker.auth

import cats.Monad
import cats.effect.Temporal
import cats.syntax.flatMap.*
import cats.syntax.applicative.*
import cats.syntax.apply.*
import cats.syntax.functor.*
import cats.syntax.alternative.*
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.MatchesRegex
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.user.{ChangePassword, Password, User, UserDetails, UserEmail, UserId, UserName, UserSettings}
import expensetracker.auth.session.{CreateSession, Session, SessionAuth}
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.common.errors.AppError.SomeoneElsesSession
import expensetracker.common.validations.*
import expensetracker.common.web.Controller
import io.circe.generic.auto.*
import io.circe.refined.*
import org.bson.types.ObjectId
import org.http4s.{AuthedRoutes, HttpRoutes}
import org.http4s.circe.CirceEntityCodec.*
import org.http4s.server.{AuthMiddleware, Router}
import org.typelevel.log4cats.Logger
import squants.market.Currency

import java.time.Instant

final class AuthController[F[_]: Logger](
    private val service: AuthService[F],
    private val dispatcher: ActionDispatcher[F]
)(using
    F: Temporal[F]
) extends Controller[F] {
  import AuthController.*

  object UserIdPath {
    def unapply(cid: String): Option[UserId] =
      ObjectId.isValid(cid).guard[Option].as(UserId(cid))
  }

  private val prefixPath = "/auth"

  private val routes: HttpRoutes[F] = HttpRoutes.of[F] {
    case req @ POST -> Root / "user" =>
      withErrorHandling {
        for {
          create <- req.as[CreateUserRequest]
          aid    <- service.createUser(create.userDetails, create.userPassword)
          _      <- dispatcher.dispatch(Action.SetupNewUser(aid))
          res    <- Created(CreateUserResponse(aid.value))
        } yield res
      }
    case req @ POST -> Root / "login" =>
      withErrorHandling {
        for {
          login <- req.as[LoginRequest]
          time  <- Temporal[F].realTime.map(t => Instant.ofEpochMilli(t.toMillis))
          acc   <- service.login(login.userEmail, login.userPassword)
          sid   <- service.createSession(CreateSession(acc.id, req.from, time))
          res   <- Ok(LoginResponse(sid.value))
        } yield res.addCookie(SessionAuth.responseCookie(sid))
      }
  }

  private val authedRoutes: AuthedRoutes[Session, F] =
    AuthedRoutes.of {
      case GET -> Root / "user" as session =>
        withErrorHandling {
          service.findUser(session.userId).map(UserView.from).flatMap(Ok(_))
        }
      case authedReq @ PUT -> Root / "user" / UserIdPath(id) / "settings" as session =>
        withErrorHandling {
          for {
            _   <- F.ensure(id.pure[F])(SomeoneElsesSession)(_ == session.userId)
            req <- authedReq.req.as[UpdateUserSettingsRequest]
            _   <- service.updateSettings(id, req.toDomain)
            res <- NoContent()
          } yield res
        }
      case authedReq @ POST -> Root / "user" / UserIdPath(id) / "password" as session =>
        withErrorHandling {
          for {
            _    <- F.ensure(id.pure[F])(SomeoneElsesSession)(_ == session.userId)
            req  <- authedReq.req.as[ChangePasswordRequest]
            _    <- service.changePassword(req.toDomain(id))
            time <- Temporal[F].realTime.map(t => Instant.ofEpochMilli(t.toMillis))
            sid  <- service.createSession(CreateSession(id, authedReq.req.from, time))
            res  <- NoContent()
          } yield res.addCookie(SessionAuth.responseCookie(sid))
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

  final case class CreateUserRequest(
      email: EmailString,
      firstName: NonEmptyString,
      lastName: NonEmptyString,
      password: NonEmptyString
  ) {
    def userDetails: UserDetails =
      UserDetails(UserEmail.from(email), UserName(firstName.value, lastName.value))

    def userPassword: Password = Password(password.value)
  }

  final case class CreateUserResponse(id: String)

  final case class LoginRequest(
      email: EmailString,
      password: NonEmptyString
  ) {
    def userEmail    = UserEmail.from(email)
    def userPassword = Password(password.value)
  }

  final case class LoginResponse(
      token: String
  )

  final case class UserView(
      id: String,
      firstName: String,
      lastName: String,
      email: String,
      settings: UserSettings,
      registrationDate: Instant
  )

  object UserView {
    def from(acc: User): UserView =
      UserView(
        acc.id.value,
        acc.name.first,
        acc.name.last,
        acc.email.value,
        acc.settings,
        acc.registrationDate
      )
  }

  final case class UpdateUserSettingsRequest(
      currency: Currency,
      hideFutureTransactions: Boolean,
      darkMode: Option[Boolean]
  ) {
    def toDomain: UserSettings =
      UserSettings(
        currency,
        hideFutureTransactions = hideFutureTransactions,
        darkMode = darkMode
      )
  }

  final case class ChangePasswordRequest(
      currentPassword: NonEmptyString,
      newPassword: NonEmptyString
  ) {
    def toDomain(id: UserId): ChangePassword =
      ChangePassword(id, Password(currentPassword.value), Password(newPassword.value))
  }

  def make[F[_]: Temporal: Logger](service: AuthService[F], dispatcher: ActionDispatcher[F]): F[AuthController[F]] =
    Monad[F].pure(AuthController[F](service, dispatcher))
}
