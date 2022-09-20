package expensetracker.auth.session

import expensetracker.auth.user.UserId
import expensetracker.common.types.{EnumType, IdType}
import io.circe.{Decoder, Encoder}

import java.time.Instant
import scala.util.Try

opaque type SessionId = String
object SessionId extends IdType[SessionId]

object SessionStatus extends EnumType[SessionStatus](() => SessionStatus.values, _.print)
enum SessionStatus:
  case Authenticated, LoggedOut, Invalidated

final case class IpAddress(host: String, port: Int)
object IpAddress {
  inline given Decoder[IpAddress] = Decoder[String].emapTry { ip =>
    Try(ip.split(":")).map { address =>
      val host = address.headOption.getOrElse("0.0.0.0")
      val port = address.drop(1).headOption.getOrElse("80")
      IpAddress(host, port.toInt)
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
