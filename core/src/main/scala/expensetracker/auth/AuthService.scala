package expensetracker.auth

import cats.Monad
import expensetracker.auth.account.{AccountEmail, AccountId, AccountService, Password}
import expensetracker.auth.session.{Session, SessionId, SessionService}

import scala.concurrent.duration.FiniteDuration

trait AuthService[F[_]] {
  def createAccount(email: AccountEmail, password: Password): F[AccountId]
  def login(email: AccountEmail, password: Password, sessionDuration: FiniteDuration): F[SessionId]
  def logout(sid: SessionId): F[Unit]
  def findSession(sid: SessionId): F[Option[Session]]
}

final private class LiveAuthService[F[_]](
    private val accountService: AccountService[F],
    private val sessionService: SessionService[F]
) extends AuthService[F] {

  override def createAccount(email: AccountEmail, password: Password): F[AccountId] = ???

  override def login(email: AccountEmail, password: Password, sessionDuration: FiniteDuration): F[SessionId] = ???

  override def logout(sid: SessionId): F[Unit] = ???

  override def findSession(sid: SessionId): F[Option[Session]] = ???
}

object AuthService {
  def make[F[_]: Monad](accSvc: AccountService[F], sessSvc: SessionService[F]): F[AuthService[F]] =
    Monad[F].pure(new LiveAuthService[F](accSvc, sessSvc))
}
