package expensetracker.fixtures

import expensetracker.account.{Account, AccountId, AccountName, CreateAccount}
import expensetracker.auth.user.UserId
import mongo4cats.bson.ObjectId
import squants.market.{Currency, GBP}

object Accounts {
  lazy val id: AccountId = AccountId(ObjectId().toHexString)

  def acc(
      id: AccountId = id,
      uid: UserId = Users.uid1,
      name: AccountName = AccountName("test-account"),
      currency: Currency = GBP,
      hidden: Option[Boolean] = None
  ): Account =
    Account(
      id,
      userId = uid,
      name = name,
      currency = currency,
      createdAt = None,
      lastUpdatedAt = None,
      hidden = hidden
    )

  def create(
      uid: UserId = Users.uid1,
      name: AccountName = AccountName("new-account"),
      currency: Currency = GBP
  ): CreateAccount =
    CreateAccount(uid, name, currency)
}
