package expensetracker.auth.session

import expensetracker.auth.user.UserId
import expensetracker.common.types.{EnumType, IdType}
import io.circe.{Decoder, Encoder}

import java.time.Instant

opaque type SessionId = String
object SessionId extends IdType[SessionId]

object SessionStatus extends EnumType[SessionStatus](() => SessionStatus.values, _.print)
enum SessionStatus:
  case Authenticated, LoggedOut, Invalidated

final case class IpAddress(host: String, port: Int)
object IpAddress {
  inline given Decoder[IpAddress] = Decoder[String].emap { ip =>
    val ipAndPort = ip.split(":")
    if (ipAndPort.length > 2) {
      Left(s"Invalid representation of IpAddress ${ip}")
    } else {
      val host = ipAndPort.headOption.getOrElse("0.0.0.0")
      val port = ipAndPort.drop(1).headOption.getOrElse("80")
      Right(IpAddress(host, port.toInt))
    }
  }
  inline given Encoder[IpAddress] = Encoder[String].contramap(ip => s"${ip.host}:${ip.port}")
}

final case class Session(
    id: SessionId,
    userId: UserId,
    createdAt: Instant,
    active: Boolean,
    status: SessionStatus,
    ipAddress: Option[IpAddress],
    lastAccessedAt: Option[Instant]
)

final case class CreateSession(
    userId: UserId,
    ipAddress: Option[IpAddress],
    time: Instant
)
