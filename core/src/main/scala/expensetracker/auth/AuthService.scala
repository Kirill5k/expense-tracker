package expensetracker.auth

import cats.Monad
import expensetracker.auth.account._
import expensetracker.auth.session._

trait AuthService[F[_]] {
  def createAccount(details: AccountDetails, password: Password): F[AccountId]
  def createSession(cs: CreateSession): F[SessionId]
  def login(email: AccountEmail, password: Password): F[Account]
  def logout(sid: SessionId): F[Unit]
  def findSession(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]]
  def findAccount(aid: AccountId): F[Account]
  def updateSettings(aid: AccountId, settings: AccountSettings): F[Unit]
  def changePassword(cp: ChangePassword): F[Unit]
}

final private class LiveAuthService[F[_]](
    private val accountService: AccountService[F],
    private val sessionService: SessionService[F]
) extends AuthService[F] {

  override def createAccount(details: AccountDetails, password: Password): F[AccountId] =
    accountService.create(details, password)

  override def createSession(cs: CreateSession): F[SessionId] =
    sessionService.create(cs)

  override def login(email: AccountEmail, password: Password): F[Account] =
    accountService.login(email, password)

  override def logout(sid: SessionId): F[Unit] =
    sessionService.unauth(sid)

  override def findSession(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]] =
    sessionService.find(sid, activity)

  override def findAccount(aid: AccountId): F[Account] =
    accountService.find(aid)

  override def updateSettings(aid: AccountId, settings: AccountSettings): F[Unit] =
    accountService.updateSettings(aid, settings)

  override def changePassword(cp: ChangePassword): F[Unit] =
    accountService.changePassword(cp)
}

object AuthService {
  def make[F[_]: Monad](accSvc: AccountService[F], sessSvc: SessionService[F]): F[AuthService[F]] =
    Monad[F].pure(new LiveAuthService[F](accSvc, sessSvc))
}
