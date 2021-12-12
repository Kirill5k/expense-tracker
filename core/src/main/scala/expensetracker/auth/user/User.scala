package expensetracker.auth.user

import expensetracker.common.IdType
import squants.market.{Currency, GBP}

import java.time.Instant

opaque type UserId = String
object UserId extends IdType[UserId]

final case class UserEmail(value: String)    extends AnyVal
final case class Password(value: String)     extends AnyVal
final case class PasswordHash(value: String) extends AnyVal

final case class UserName(
    first: String,
    last: String
)

final case class UserSettings(
    currency: Currency,
    hideFutureTransactions: Boolean,
    darkMode: Option[Boolean]
)

object UserSettings {
  val Default = UserSettings(
    GBP,
    hideFutureTransactions = false,
    darkMode = None
  )
}

final case class User(
    id: UserId,
    email: UserEmail,
    name: UserName,
    password: PasswordHash,
    settings: UserSettings,
    registrationDate: Instant
)

final case class UserDetails(
    email: UserEmail,
    name: UserName
)

final case class ChangePassword(
    id: UserId,
    currentPassword: Password,
    newPassword: Password
)
