package expensetracker.auth

import cats.Monad
import cats.implicits._
import expensetracker.auth.account._
import expensetracker.auth.session._

trait AuthService[F[_]] {
  def createAccount(details: AccountDetails, password: Password): F[AccountId]
  def login(email: AccountEmail, password: Password, cs: CreateSession): F[SessionId]
  def logout(sid: SessionId): F[Unit]
  def findSession(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]]
}

final private class LiveAuthService[F[_]: Monad](
    private val accountService: AccountService[F],
    private val sessionService: SessionService[F]
) extends AuthService[F] {

  override def createAccount(details: AccountDetails, password: Password): F[AccountId] =
    accountService.create(details, password)

  override def login(email: AccountEmail, password: Password, cs: CreateSession): F[SessionId] =
    accountService.login(email, password).flatMap(aid => sessionService.create(aid, cs))

  override def logout(sid: SessionId): F[Unit] =
    sessionService.delete(sid)

  override def findSession(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]] =
    sessionService.find(sid, activity)
}

object AuthService {
  def make[F[_]: Monad](accSvc: AccountService[F], sessSvc: SessionService[F]): F[AuthService[F]] =
    Monad[F].pure(new LiveAuthService[F](accSvc, sessSvc))
}
