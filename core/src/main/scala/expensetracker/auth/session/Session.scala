package expensetracker.auth.session

import com.comcast.ip4s.IpAddress
import expensetracker.auth.account.AccountId

import java.time.Instant

final case class SessionId(value: String) extends AnyVal

sealed trait SessionStatus
object SessionStatus {
  case object Authenticated extends SessionStatus
  case object LoggedOut     extends SessionStatus
}

final case class SessionActivity(
    ipAddress: IpAddress,
    time: Instant
)

final case class Session(
    id: SessionId,
    accountId: AccountId,
    createdAt: Instant,
    active: Boolean,
    status: SessionStatus,
    lastRecordedActivity: Option[SessionActivity]
)

final case class CreateSession(
    accountId: AccountId,
    ipAddress: Option[IpAddress],
    time: Instant
)
