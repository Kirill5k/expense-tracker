package expensetracker.auth.user

import io.circe.Codec
import expensetracker.common.types.{IdType, StringType}
import expensetracker.common.json.given
import squants.market.{Currency, GBP}
import expensetracker.common.validations.EmailString

import java.time.Instant

opaque type UserId = String
object UserId extends IdType[UserId]

opaque type UserEmail = String
object UserEmail extends StringType[UserEmail]:
  def from(email: EmailString): UserEmail = email.value.toLowerCase

opaque type Password = String
object Password extends StringType[Password]
opaque type PasswordHash = String
object PasswordHash extends StringType[PasswordHash]

final case class UserName(
    first: String,
    last: String
) derives Codec.AsObject

final case class UserSettings(
    currency: Currency,
    hideFutureTransactions: Boolean,
    darkMode: Option[Boolean]
) derives Codec.AsObject

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

final case class Login(
    email: UserEmail,
    password: Password
)
