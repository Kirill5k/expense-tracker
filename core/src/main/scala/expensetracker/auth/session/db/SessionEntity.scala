package expensetracker.auth.session.db

import expensetracker.auth.user.UserId
import expensetracker.auth.session.{CreateSession, Session, SessionActivity, SessionId, SessionStatus}
import mongo4cats.bson.ObjectId

import java.time.Instant

final case class SessionEntity(
    _id: ObjectId,
    userId: ObjectId,
    createdAt: Instant,
    active: Boolean,
    status: SessionStatus,
    lastRecordedActivity: Option[SessionActivity]
) {
  def toDomain: Session =
    Session(
      id = SessionId(_id),
      userId = UserId(userId),
      createdAt = createdAt,
      active = active,
      status = status,
      lastRecordedActivity = lastRecordedActivity
    )
}

object SessionEntity {
  def create(cs: CreateSession): SessionEntity =
    SessionEntity(
      ObjectId(),
      cs.userId.toObjectId,
      cs.time,
      true,
      SessionStatus.Authenticated,
      cs.ipAddress.map(ip => SessionActivity(ip, cs.time))
    )
}
