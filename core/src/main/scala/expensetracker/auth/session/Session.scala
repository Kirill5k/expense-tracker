package expensetracker.auth.session

import com.comcast.ip4s.IpAddress
import expensetracker.auth.user.UserId

import java.time.Instant

final case class SessionId(value: String) extends AnyVal

sealed abstract class SessionStatus(val value: String)
object SessionStatus {
  case object Authenticated extends SessionStatus("authenticated")
  case object LoggedOut     extends SessionStatus("logged-out")
  case object Invalidated   extends SessionStatus("invalidated")

  private val all: List[SessionStatus] = List(Authenticated, LoggedOut, Invalidated)

  def from(value: String): Either[String, SessionStatus] =
    all.find(_.value == value).toRight(s"Unexpected session status $value")
}

final case class SessionActivity(
    ipAddress: IpAddress,
    time: Instant
)

final case class Session(
    id: SessionId,
    userId: UserId,
    createdAt: Instant,
    active: Boolean,
    status: SessionStatus,
    lastRecordedActivity: Option[SessionActivity]
)

final case class CreateSession(
    accountId: UserId,
    ipAddress: Option[IpAddress],
    time: Instant
)
