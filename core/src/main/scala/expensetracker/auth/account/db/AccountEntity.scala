package expensetracker.auth.account.db

import expensetracker.auth.account._
import org.bson.types.ObjectId

final case class AccountEntity(
    _id: ObjectId,
    email: String,
    name: AccountName,
    password: String,
    settings: Option[AccountSettings]
) {
  def toDomain: Account =
    Account(
      id = AccountId(_id.toHexString),
      email = AccountEmail(email),
      name = name,
      password = PasswordHash(password),
      settings.getOrElse(AccountSettings.Default)
    )
}

object AccountEntity {
  def create(details: AccountDetails, password: PasswordHash): AccountEntity =
    AccountEntity(
      new ObjectId(),
      details.email.value,
      details.name,
      password.value,
      Some(AccountSettings.Default)
    )
}
