package expensetracker.auth.session

import io.circe.Json
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec
import io.circe.syntax.*
import io.circe.parser.*

class SessionSpec extends AnyWordSpec with Matchers {

  "A Session json codecs" should {
    "encode and decode ip addresses" in {
      val ipAddress = IpAddress("127.0.0.1", 8080)

      ipAddress.asJson mustBe Json.fromString("127.0.0.1:8080")
      decode[IpAddress]("\"127.0.0.1:8080\"") mustBe Right(ipAddress)
    }
  }
}
