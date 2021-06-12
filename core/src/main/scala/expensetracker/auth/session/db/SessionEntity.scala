package expensetracker.auth.session.db

import expensetracker.auth.account.AccountId
import expensetracker.auth.session.{Session, SessionId}
import org.bson.types.ObjectId

import java.time.Instant
import scala.concurrent.duration.FiniteDuration

final case class SessionEntity(
    id: ObjectId,
    accountId: ObjectId,
    createdAt: Instant,
    expiresAt: Instant
) {
  def toDomain: Session =
    Session(
      id = SessionId(id.toHexString),
      accountId = AccountId(accountId.toHexString),
      createdAt = createdAt,
      expiresAt = expiresAt
    )
}

object SessionEntity {
  def create(aid: AccountId, duration: FiniteDuration): SessionEntity =
    SessionEntity(
      new ObjectId(),
      new ObjectId(aid.value),
      Instant.now(),
      Instant.now().plusMillis(duration.toMillis)
    )
}
