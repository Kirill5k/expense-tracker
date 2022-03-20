package expensetracker.auth

import cats.Monad
import cats.syntax.flatMap.*
import cats.syntax.apply.*
import expensetracker.auth.jwt.BearerToken
import expensetracker.auth.user.*
import expensetracker.auth.session.*

final case class Login(email: UserEmail, password: Password)
final case class Authenticate(token: BearerToken)

trait AuthService[F[_]]:
  def createUser(details: UserDetails, password: Password): F[UserId]
  def createSession(cs: CreateSession): F[BearerToken]
  def authenticate(auth: Authenticate): F[Session]
  def login(login: Login): F[User]
  def logout(sid: SessionId): F[Unit]
  def findUser(uid: UserId): F[User]
  def updateSettings(uid: UserId, settings: UserSettings): F[Unit]
  def changePassword(cp: ChangePassword): F[Unit]

final private class LiveAuthService[F[_]: Monad](
    private val accountService: UserService[F],
    private val sessionService: SessionService[F]
) extends AuthService[F] {

  override def createUser(details: UserDetails, password: Password): F[UserId] =
    accountService.create(details, password)

  override def createSession(cs: CreateSession): F[BearerToken] =
    sessionService.create(cs)

  override def authenticate(auth: Authenticate): F[Session] =
    sessionService.authenticate(auth)

  override def login(login: Login): F[User] =
    accountService.login(login)

  override def logout(sid: SessionId): F[Unit] =
    sessionService.unauth(sid)

  override def findUser(uid: UserId): F[User] =
    accountService.find(uid)

  override def updateSettings(uid: UserId, settings: UserSettings): F[Unit] =
    accountService.updateSettings(uid, settings)

  override def changePassword(cp: ChangePassword): F[Unit] =
    accountService.changePassword(cp) *>
      sessionService.invalidateAll(cp.id)
}

object AuthService {
  def make[F[_]: Monad](accSvc: UserService[F], sessSvc: SessionService[F]): F[AuthService[F]] =
    Monad[F].pure(new LiveAuthService[F](accSvc, sessSvc))
}
