package expensetracker.auth

import expensetracker.auth.account.{AccountEmail, AccountId, Password}
import expensetracker.auth.session.{Session, SessionId}

trait AuthService[F[_]] {
  def createAccount(email: AccountEmail, password: Password): F[AccountId]
  def login(email: AccountEmail, password: Password): F[SessionId]
  def logout(sid: SessionId): F[Unit]
  def findSession(sid: SessionId): F[Option[Session]]
}
