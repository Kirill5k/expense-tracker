package expensetracker.auth

import cats.Monad
import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.MatchesRegex
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.jwt.BearerToken
import expensetracker.auth.session.{CreateSession, IpAddress, SessionService}
import expensetracker.auth.user.*
import expensetracker.category.CategoryController.CategoryView
import expensetracker.common.errors.AppError
import expensetracker.common.validations.*
import expensetracker.common.web.{Controller, TapirJson, TapirSchema}
import io.circe.Codec
import io.circe.refined.*
import org.http4s.HttpRoutes
import squants.market.Currency
import sttp.model.StatusCode
import sttp.tapir.*

import java.time.Instant

final private class AuthController[F[_]](
    private val userService: UserService[F],
    private val sessionService: SessionService[F]
)(using
    F: Async[F]
) extends Controller[F] {
  import AuthController.*

  private def logout(using authenticator: Authenticator[F]) =
    logoutEndpoint.withAuthenticatedSession
      .serverLogic { session => _ =>
        sessionService
          .unauth(session.id)
          .voidResponse
      }

  private def changePassword(using authenticator: Authenticator[F]) =
    changePasswordEndpoint.withAuthenticatedSession
      .serverLogic { session => (uid, req) =>
        F.raiseWhen(uid != session.userId)(AppError.SomeoneElsesSession) >>
          userService.changePassword(req.toDomain(uid)) >>
          sessionService.invalidateAll(uid).voidResponse
      }

  private def updateSettings(using authenticator: Authenticator[F]) =
    updateUserSettingsEndpoint.withAuthenticatedSession
      .serverLogic { session => (uid, req) =>
        F.raiseWhen(uid != session.userId)(AppError.SomeoneElsesSession) >>
          userService.updateSettings(uid, req.toDomain).voidResponse
      }

  private def getCurrentUser(using authenticator: Authenticator[F]) =
    getCurrentUserEndpoint.withAuthenticatedSession
      .serverLogic { session => _ =>
        userService.find(session.userId).mapResponse(UserView.from)
      }

  private def deleteCurrentUser(using authenticator: Authenticator[F]) =
    deleteCurrentUserEndpoint.withAuthenticatedSession
      .serverLogic { session => _ =>
        userService.delete(session.userId).voidResponse
      }

  private def deleteCurrentUserData(using authenticator: Authenticator[F]) =
    deleteCurrentUserDataEndpoint.withAuthenticatedSession
      .serverLogic { session => _ =>
        userService.deleteData(session.userId).voidResponse
      }

  private def createUser =
    createUserEndpoint
      .serverLogic { req =>
        userService
          .create(req.userDetails, req.userPassword)
          .mapResponse(uid => CreateUserResponse(uid.value))
      }

  private def login =
    loginEndpoint
      .serverLogic { (ip, login) =>
        for
          acc  <- userService.login(login.toDomain)
          time <- F.realTimeInstant
          res  <- sessionService.create(CreateSession(acc.id, ip, time)).mapResponse(LoginResponse.bearer)
        yield res
      }

  def routes(using authenticator: Authenticator[F]): HttpRoutes[F] =
    Controller
      .serverInterpreter[F]
      .toRoutes(
        List(
          login,
          createUser,
          getCurrentUser,
          updateSettings,
          changePassword,
          logout,
          deleteCurrentUser,
          deleteCurrentUserData
        )
      )
}

object AuthController extends TapirSchema with TapirJson {

  final case class CreateUserRequest(
      email: EmailString,
      firstName: NonEmptyString,
      lastName: NonEmptyString,
      password: NonEmptyString,
      currency: Currency
  ) derives Codec.AsObject {
    def userDetails: UserDetails =
      UserDetails(UserEmail.from(email), UserName(firstName.value, lastName.value), currency)
    def userPassword: Password = Password(password.value)
  }

  final case class CreateUserResponse(id: String) derives Codec.AsObject

  final case class LoginRequest(
      email: EmailString,
      password: NonEmptyString
  ) derives Codec.AsObject {
    def toDomain: Login = Login(UserEmail.from(email), Password(password.value))
  }

  final case class LoginResponse(
      access_token: String,
      token_type: String
  ) derives Codec.AsObject

  object LoginResponse:
    def bearer(bearerToken: BearerToken): LoginResponse =
      LoginResponse(access_token = bearerToken.value, token_type = "Bearer")

  final case class UserView(
      id: String,
      firstName: String,
      lastName: String,
      email: String,
      settings: UserSettings,
      registrationDate: Instant,
      categories: Option[List[CategoryView]],
      totalTransactionCount: Option[Int]
  ) derives Codec.AsObject

  object UserView:
    def from(acc: User): UserView =
      UserView(
        acc.id.value,
        acc.name.first,
        acc.name.last,
        acc.email.value,
        acc.settings,
        acc.registrationDate,
        acc.categories.map(_.map(CategoryView.from)),
        acc.totalTransactionCount
      )

  final case class UpdateUserSettingsRequest(
      currency: Currency,
      hideFutureTransactions: Boolean,
      darkMode: Option[Boolean],
      futureTransactionVisibilityDays: Option[Int]
  ) derives Codec.AsObject:
    def toDomain: UserSettings =
      UserSettings(
        currency,
        hideFutureTransactions = hideFutureTransactions,
        darkMode = darkMode,
        futureTransactionVisibilityDays = futureTransactionVisibilityDays
      )

  final case class ChangePasswordRequest(
      currentPassword: NonEmptyString,
      newPassword: NonEmptyString
  ) derives Codec.AsObject:
    def toDomain(id: UserId): ChangePassword =
      ChangePassword(id, Password(currentPassword.value), Password(newPassword.value))

  private val basePath   = "auth"
  private val userPath   = basePath / "user"
  private val userIdPath = userPath / path[String].validate(Controller.validId).map((s: String) => UserId(s))(_.value).name("user-id")

  val createUserEndpoint = Controller.publicEndpoint.post
    .in(userPath)
    .in(jsonBody[CreateUserRequest])
    .out(statusCode(StatusCode.Created).and(jsonBody[CreateUserResponse]))
    .description("Register new user")

  val loginEndpoint = Controller.publicEndpoint.post
    .in(basePath / "login")
    .in(extractFromRequest(_.connectionInfo.remote.map(ip => IpAddress(ip.getHostName, ip.getPort))))
    .in(jsonBody[LoginRequest])
    .out(jsonBody[LoginResponse])
    .description("Login with the existing user account")

  val getCurrentUserEndpoint = Controller.securedEndpoint.get
    .in(userPath)
    .out(jsonBody[UserView])
    .description("Get currently logged in user")

  val deleteCurrentUserEndpoint = Controller.securedEndpoint.delete
    .in(userPath)
    .out(statusCode(StatusCode.NoContent))
    .description("Permanently delete currently logged in user")

  val deleteCurrentUserDataEndpoint = Controller.securedEndpoint.delete
    .in(userPath / "data")
    .out(statusCode(StatusCode.NoContent))
    .description("Permanently delete currently logged in user's data")

  val updateUserSettingsEndpoint = Controller.securedEndpoint.put
    .in(userIdPath / "settings")
    .in(jsonBody[UpdateUserSettingsRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Update user's settings")

  val changePasswordEndpoint = Controller.securedEndpoint.post
    .in(userIdPath / "password")
    .in(jsonBody[ChangePasswordRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Change user's password")

  val logoutEndpoint = Controller.securedEndpoint.post
    .in(basePath / "logout")
    .out(statusCode(StatusCode.NoContent))
    .description("Logout and invalidate current session")

  def make[F[_]: Async](
      userService: UserService[F],
      sessionService: SessionService[F]
  ): F[Controller[F]] =
    Monad[F].pure(AuthController[F](userService, sessionService))
}
