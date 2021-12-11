package expensetracker.fixtures

import expensetracker.auth.user.{PasswordHash, UserDetails, UserEmail, UserId, UserName}
import mongo4cats.bson.ObjectId

import java.time.Instant
import java.time.temporal.ChronoField

object Users {
  lazy val uid1 = UserId(ObjectId().toHexString)
  lazy val uid2 = UserId(ObjectId().toHexString)

  lazy val regDate = Instant.now.`with`(ChronoField.MILLI_OF_SECOND, 0)
  lazy val hash    = PasswordHash("hash")
  lazy val details = UserDetails(UserEmail("acc1@et.com"), UserName("John", "Bloggs"))
}
