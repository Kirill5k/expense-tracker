package expensetracker.common

import java.time.Instant
import scala.util.Try

object time {
  extension (dateString: String)
    def toInstant: Either[Throwable, Instant] =
      val localDate = dateString.length match
        case 10 => s"${dateString}T00:00:00Z"
        case 19 => s"${dateString}Z"
        case _ => dateString
      Try(Instant.parse(localDate)).toEither
}
