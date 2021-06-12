package expensetracker.auth.account

trait AccountService[F[_]] {
  def create(email: AccountEmail, password: Password): F[AccountId]
  def login(email: AccountEmail, password: Password): F[Unit]
}
