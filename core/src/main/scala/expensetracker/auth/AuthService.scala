package expensetracker.auth

import expensetracker.auth.account.{AccountEmail, Password}
import expensetracker.auth.session.SessionId

trait AuthService[F[_]] {
  def login(email: AccountEmail, password: Password): F[SessionId]
}
