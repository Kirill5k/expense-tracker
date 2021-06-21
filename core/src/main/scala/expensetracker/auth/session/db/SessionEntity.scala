package expensetracker.auth.session.db

import expensetracker.auth.account.AccountId
import expensetracker.auth.session.{CreateSession, Session, SessionActivity, SessionId, SessionStatus}
import org.bson.types.ObjectId

import java.time.Instant

final case class SessionEntity(
    _id: ObjectId,
    accountId: ObjectId,
    createdAt: Instant,
    active: Boolean,
    status: SessionStatus,
    lastRecordedActivity: Option[SessionActivity]
) {
  def toDomain: Session =
    Session(
      id = SessionId(_id.toHexString),
      accountId = AccountId(accountId.toHexString),
      createdAt = createdAt,
      active = active,
      status = status,
      lastRecordedActivity = lastRecordedActivity
    )
}

object SessionEntity {
  def create(cs: CreateSession): SessionEntity =
    SessionEntity(
      new ObjectId(),
      new ObjectId(cs.accountId.value),
      cs.time,
      true,
      SessionStatus.Authenticated,
      cs.ipAddress.map(ip => SessionActivity(ip, cs.time))
    )
}
