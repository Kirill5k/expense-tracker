package expensetracker.fixtures

import expensetracker.auth.user.{PasswordHash, UserDetails, UserEmail, UserId, UserName}
import mongo4cats.bson.ObjectId

import java.time.Instant

object Users {
  lazy val uid1 = UserId(ObjectId().toHexString)
  lazy val uid2 = UserId(ObjectId().toHexString)

  lazy val regDate = Instant.now
  lazy val hash    = PasswordHash("hash")
  lazy val details = UserDetails(UserEmail("acc1@et.com"), UserName("John", "Bloggs"))
}
