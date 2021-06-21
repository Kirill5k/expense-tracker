package expensetracker.auth.session

import com.comcast.ip4s.IpAddress
import expensetracker.auth.account.AccountId
import io.circe.{Decoder, Encoder}

import java.time.Instant

final case class SessionId(value: String) extends AnyVal

sealed trait SessionStatus
object SessionStatus {
  case object Authenticated extends SessionStatus
  case object LoggedOut     extends SessionStatus

  implicit val decodeSessionStatus: Decoder[SessionStatus] = Decoder[String].emap {
    case "authenticated" => Right(Authenticated)
    case "logged-out"    => Right(LoggedOut)
    case other           => Left(s"invalid session status $other")
  }

  implicit val encodeSessionStatus: Encoder[SessionStatus] = Encoder[String].contramap {
    case Authenticated => "authenticated"
    case LoggedOut     => "logged-out"
  }
}

final case class SessionActivity(ipAddress: IpAddress, time: Instant)

object SessionActivity {
  implicit val decodeIpAddress: Decoder[IpAddress] = Decoder[String].emap { ip =>
    IpAddress.fromString(ip).toRight(s"invalid ip address $ip")
  }

  implicit val encodeIpAddress: Encoder[IpAddress] = Encoder[String].contramap(_.toUriString)
}

/** Fields to add: active: Boolean - if false, user needs to confirm his activity status: String
  */
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
