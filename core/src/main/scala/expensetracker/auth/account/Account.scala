package expensetracker.auth.account

final case class AccountId(value: String)    extends AnyVal
final case class AccountEmail(value: String) extends AnyVal
final case class Password(value: String)     extends AnyVal
final case class PasswordHash(value: String) extends AnyVal

final case class AccountName(
    first: String,
    last: String
)

final case class Account(
    id: AccountId,
    email: AccountEmail,
    name: AccountName,
    password: PasswordHash
)

final case class AccountDetails(
    email: AccountEmail,
    name: AccountName
)
