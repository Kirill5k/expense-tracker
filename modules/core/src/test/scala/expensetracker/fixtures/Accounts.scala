package expensetracker.fixtures

import expensetracker.accounts.AccountId
import mongo4cats.bson.ObjectId

object Accounts {
  lazy val id: AccountId = AccountId(ObjectId().toHexString)
}
