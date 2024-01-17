package expensetracker.health

import cats.effect.IO
import expensetracker.{ControllerSpec, MockClock}
import expensetracker.auth.Authenticator
import expensetracker.common.Clock
import org.http4s.implicits.*
import org.http4s.*

import java.time.Instant
import scala.concurrent.duration.*

class HealthControllerSpec extends ControllerSpec {

  val ipAddress = "127.0.0.1"
  val ts = Instant.parse("2020-01-01T00:00:00Z")

  given clock: Clock[IO] = MockClock[IO](ts)

  "A HealthController" should {
    given Authenticator[IO] = _ => IO.raiseError(new RuntimeException())

    "return status of the app" in {
      val controller = HealthController[IO]("expense-tracker-core", ts, ipAddress, Some("v0.0.1"))

      val response = for
        _ <- clock.sleep(1.day + 2.hours + 30.minutes + 10.seconds)
        req = Request[IO](uri = uri"/health/status", method = Method.GET)
        res <- controller.routes.orNotFound.run(req)
      yield res

      val responseBody =
        s"""{
           |"service": "expense-tracker-core",
           |"startupTime": "$ts",
           |"appVersion": "v0.0.1",
           |"upTime": "1d2h30m10s",
           |"serverIpAddress": "$ipAddress"
           |}""".stripMargin
      response mustHaveStatus(Status.Ok, Some(responseBody))
    }
  }
}
