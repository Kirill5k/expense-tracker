package expensetracker.auth.session.db

import expensetracker.auth.user.UserId
import expensetracker.auth.session.{CreateSession, Session, SessionId, SessionStatus, IpAddress}
import mongo4cats.bson.ObjectId

import java.time.Instant

final case class SessionEntity(
    _id: ObjectId,
    userId: ObjectId,
    createdAt: Instant,
    active: Boolean,
    status: SessionStatus,
    ipAddress: Option[IpAddress],
    lastAccessedAt: Option[Instant]
) {
  def toDomain: Session =
    Session(
      id = SessionId(_id),
      userId = UserId(userId),
      createdAt = createdAt,
      active = active,
      status = status,
      ipAddress = ipAddress,
      lastAccessedAt = lastAccessedAt
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
      cs.ipAddress,
      None
    )
}
