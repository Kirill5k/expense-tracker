package expensetracker.auth.account

final case class AccountId(value: String)    extends AnyVal
final case class AccountEmail(value: String) extends AnyVal
final case class PasswordHash(value: String) extends AnyVal

final case class Account(
    id: AccountId,
    email: AccountEmail,
    password: PasswordHash
)
