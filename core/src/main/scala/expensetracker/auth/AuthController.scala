package expensetracker.auth

import cats.Monad
import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.applicative.*
import cats.syntax.functor.*
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.MatchesRegex
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.user.{ChangePassword, Password, User, UserDetails, UserEmail, UserId, UserName, UserSettings}
import expensetracker.auth.session.{CreateSession, Session}
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.common.errors.AppError.SomeoneElsesSession
import expensetracker.auth.jwt.BearerToken
import expensetracker.common.validations.*
import expensetracker.common.web.SecuredController
import io.circe.generic.auto.*
import io.circe.refined.*
import org.http4s.HttpRoutes
import squants.market.Currency
import sttp.model.StatusCode
import sttp.tapir.*
import sttp.tapir.server.http4s.Http4sServerInterpreter

import java.time.Instant
import java.time.temporal.Temporal

final class AuthController[F[_]](
    private val service: AuthService[F],
    private val dispatcher: ActionDispatcher[F]
)(using
    F: Async[F]
) extends SecuredController[F] {
  import AuthController.*

  private val basePath   = "auth"
  private val userPath   = basePath / "user"
  private val userIdPath = basePath / path[String].map((s: String) => UserId(s))(_.value)

  private def logout(auth: Authenticate => F[Session]) =
    securedEndpoint(auth).post
      .in(basePath / "logout")
      .out(statusCode(StatusCode.NoContent))
      .serverLogic { session => _ =>
        service
          .logout(session.id)
          .voidResponse
      }

  private def changePassword(auth: Authenticate => F[Session]) =
    securedEndpoint(auth).post
      .in(userIdPath / "password")
      .in(jsonBody[ChangePasswordRequest])
      .out(statusCode(StatusCode.NoContent))
      .serverLogic { session => (uid, req) =>
        F.ensure(uid.pure[F])(SomeoneElsesSession)(_ == session.userId) >>
          service
            .changePassword(req.toDomain(uid))
            .voidResponse
      }

  private def updateSettings(auth: Authenticate => F[Session]) =
    securedEndpoint(auth).put
      .in(userIdPath / "settings")
      .in(jsonBody[UpdateUserSettingsRequest])
      .out(statusCode(StatusCode.NoContent))
      .serverLogic { session => (uid, req) =>
        F.ensure(uid.pure[F])(SomeoneElsesSession)(_ == session.userId) >>
          service.updateSettings(uid, req.toDomain).voidResponse
      }

  private def getCurrentUser(auth: Authenticate => F[Session]) =
    securedEndpoint(auth).get
      .in(userPath)
      .out(jsonBody[UserView])
      .serverLogic { session => _ =>
        service
          .findUser(session.userId)
          .mapResponse(UserView.from)
      }

  private def createUser = publicEndpoint.post
    .in(userPath)
    .in(jsonBody[CreateUserRequest])
    .out(statusCode(StatusCode.Created).and(jsonBody[CreateUserResponse]))
    .serverLogic { req =>
      service
        .createUser(req.userDetails, req.userPassword)
        .flatTap(uid => dispatcher.dispatch(Action.SetupNewUser(uid)))
        .mapResponse(uid => CreateUserResponse(uid.value))
    }

  private def login = publicEndpoint.post
    .in(basePath / "login")
    .in(extractFromRequest(_.connectionInfo.remote))
    .in(jsonBody[LoginRequest])
    .out(jsonBody[LoginResponse])
    .serverLogic { (ip, login) =>
      for {
        acc  <- service.login(login.toDomain)
        time <- F.realTimeInstant
        res  <- service.createSession(CreateSession(acc.id, ip, time)).mapResponse(LoginResponse.bearer)
      } yield res
    }

  def routes(auth: Authenticate => F[Session]): HttpRoutes[F] =
    Http4sServerInterpreter[F](serverOptions).toRoutes(
      List(
        login,
        createUser,
        getCurrentUser(auth),
        updateSettings(auth),
        changePassword(auth),
        logout(auth)
      )
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
    def toDomain: Login = Login(UserEmail.from(email), Password(password.value))
  }

  final case class LoginResponse(
      access_token: String,
      token_type: String
  )

  object LoginResponse {
    def bearer(bearerToken: BearerToken): LoginResponse =
      LoginResponse(access_token = bearerToken.value, token_type = "Bearer")
  }

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

  def make[F[_]: Async](
      service: AuthService[F],
      dispatcher: ActionDispatcher[F]
  ): F[AuthController[F]] =
    Monad[F].pure(AuthController[F](service, dispatcher))
}
