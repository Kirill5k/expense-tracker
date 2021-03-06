package expensetracker.health

import cats.effect.{IO, Ref}
import expensetracker.ControllerSpec
import expensetracker.auth.Authenticator
import org.http4s.implicits.*
import org.http4s.*
import org.http4s.Header.Raw
import org.typelevel.ci.CIString

import java.time.Instant

class HealthControllerSpec extends ControllerSpec {

  val ts = Instant.parse("2021-01-01T00:00:00Z")

  "A HealthController" should {

    given auth: Authenticator[IO] = _ => IO.raiseError(new RuntimeException("shouldn't reach this"))

    "return status on the app" in {
      val controller = Ref.of[IO, Instant](ts).map(t => new HealthController[IO](t))

      val request  = Request[IO](uri = uri"/health/status", method = Method.GET, headers = Headers(Raw(CIString("foo"), "bar")))
      val response = controller.flatMap(_.routes.orNotFound.run(request))

      verifyJsonResponse(response, Status.Ok, Some(s"""{"startupTime":"$ts"}"""))
    }
  }
}
