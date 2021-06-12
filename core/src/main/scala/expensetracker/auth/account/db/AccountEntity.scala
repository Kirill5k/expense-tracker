package expensetracker.auth.account.db

import expensetracker.auth.account.{Account, AccountDetails, AccountEmail, AccountId, AccountName, PasswordHash}
import org.bson.types.ObjectId

final case class AccountEntity(
    id: ObjectId,
    email: String,
    name: AccountName,
    password: String,
) {
  def toDomain: Account =
    Account(
      id = AccountId(id.toHexString),
      email = AccountEmail(email),
      name = name,
      password = PasswordHash(password)
    )
}

object AccountEntity {
  def create(details: AccountDetails, password: PasswordHash): AccountEntity =
    AccountEntity(
      new ObjectId(),
      details.email.value,
      details.name,
      password.value
    )
}
