package expensetracker.auth.account.db

import expensetracker.auth.account.{PasswordHash, Account, AccountId, AccountEmail}
import org.bson.types.ObjectId

final case class AccountEntity(
    id: ObjectId,
    email: String,
    password: String
) {
  def toDomain: Account =
    Account(
      id = AccountId(id.toHexString),
      email = AccountEmail(email),
      password = PasswordHash(password)
    )
}

object AccountEntity {
  def create(email: AccountEmail, password: PasswordHash): AccountEntity =
    AccountEntity(
      new ObjectId(),
      email.value,
      password.value
    )
}
