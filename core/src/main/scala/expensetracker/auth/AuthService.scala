package expensetracker.auth

import cats.Monad
import cats.implicits._
import expensetracker.auth.user._
import expensetracker.auth.session._

trait AuthService[F[_]] {
  def createUser(details: UserDetails, password: Password): F[UserId]
  def createSession(cs: CreateSession): F[SessionId]
  def login(email: UserEmail, password: Password): F[User]
  def logout(sid: SessionId): F[Unit]
  def findSession(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]]
  def findUser(aid: UserId): F[User]
  def updateSettings(aid: UserId, settings: UserSettings): F[Unit]
  def changePassword(cp: ChangePassword): F[Unit]
}

final private class LiveAuthService[F[_]: Monad](
    private val accountService: UserService[F],
    private val sessionService: SessionService[F]
) extends AuthService[F] {

  override def createUser(details: UserDetails, password: Password): F[UserId] =
    accountService.create(details, password)

  override def createSession(cs: CreateSession): F[SessionId] =
    sessionService.create(cs)

  override def login(email: UserEmail, password: Password): F[User] =
    accountService.login(email, password)

  override def logout(sid: SessionId): F[Unit] =
    sessionService.unauth(sid)

  override def findSession(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]] =
    sessionService.find(sid, activity)

  override def findUser(aid: UserId): F[User] =
    accountService.find(aid)

  override def updateSettings(aid: UserId, settings: UserSettings): F[Unit] =
    accountService.updateSettings(aid, settings)

  override def changePassword(cp: ChangePassword): F[Unit] =
    accountService.changePassword(cp) *>
      sessionService.invalidateAll(cp.id)
}

object AuthService {
  def make[F[_]: Monad](accSvc: UserService[F], sessSvc: SessionService[F]): F[AuthService[F]] =
    Monad[F].pure(new LiveAuthService[F](accSvc, sessSvc))
}
