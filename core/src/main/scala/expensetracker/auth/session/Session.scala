package expensetracker.auth.session

import com.comcast.ip4s.IpAddress
import expensetracker.auth.account.AccountId
import io.circe.{Decoder, Encoder}

import java.time.Instant
import scala.concurrent.duration.FiniteDuration

final case class SessionId(value: String) extends AnyVal

final case class SessionActivity(ipAddress: IpAddress, time: Instant)

object SessionActivity {
  implicit val decodeIpAddress: Decoder[IpAddress] = Decoder[String].emap { ip =>
    IpAddress.fromString(ip).toRight(s"invalid ip address $ip")
  }

  implicit val encodeIpAddress: Encoder[IpAddress] = Encoder[String].contramap(_.toUriString)
}

/**
 * Fields to add:
 * active: Boolean - if false, user needs to confirm his activity
 * status: String
 */
final case class Session(
    id: SessionId,
    accountId: AccountId,
    createdAt: Instant,
    expiresAt: Instant,
    lastRecordedActivity: Option[SessionActivity]
)

final case class CreateSession(
    ipAddress: Option[IpAddress],
    time: Instant,
    duration: FiniteDuration
)
