package expensetracker.fixtures

import expensetracker.auth.user.UserId
import mongo4cats.bson.ObjectId

object Users {

  lazy val uid1 = UserId(ObjectId().toHexString)
  lazy val uid2 = UserId(ObjectId().toHexString)
}
