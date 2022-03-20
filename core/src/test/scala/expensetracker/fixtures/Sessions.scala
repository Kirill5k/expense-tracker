package expensetracker.fixtures

import expensetracker.auth.session.*
import expensetracker.auth.user.UserId
import mongo4cats.bson.ObjectId

import java.net.InetSocketAddress
import java.time.Instant
import java.time.temporal.ChronoField

object Sessions {
  lazy val sid  = SessionId(ObjectId().toHexString)
  lazy val sid2 = SessionId(ObjectId().toHexString)
  lazy val ts   = Instant.now().`with`(ChronoField.MILLI_OF_SECOND, 0)
  lazy val ip   = InetSocketAddress.createUnresolved("127.0.0.1", 8080)

  lazy val sess = Session(sid, Users.uid1, ts, true, SessionStatus.Authenticated, Some(ip), None)

  def create(
      uid: UserId = Users.uid1,
      ip: Option[InetSocketAddress] = Some(ip),
      ts: Instant = ts
  ): CreateSession = CreateSession(uid, ip, ts)
}
