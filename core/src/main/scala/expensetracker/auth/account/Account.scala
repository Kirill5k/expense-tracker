package expensetracker.auth.account

import squants.market.{Currency, GBP}

import java.time.Instant

final case class AccountId(value: String)    extends AnyVal
final case class AccountEmail(value: String) extends AnyVal
final case class Password(value: String)     extends AnyVal
final case class PasswordHash(value: String) extends AnyVal

final case class AccountName(
    first: String,
    last: String
)

final case class AccountSettings(
    currency: Currency,
    hideFutureTransactions: Boolean,
    darkMode: Option[Boolean]
)

object AccountSettings {
  val Default = AccountSettings(
    GBP,
    hideFutureTransactions = false,
    darkMode = None
  )
}

final case class Account(
    id: AccountId,
    email: AccountEmail,
    name: AccountName,
    password: PasswordHash,
    settings: AccountSettings,
    registrationDate: Instant
)

final case class AccountDetails(
    email: AccountEmail,
    name: AccountName
)

final case class ChangePassword(
    id: AccountId,
    currentPassword: Password,
    newPassword: Password
)
