package expensetracker.health

import cats.effect.IO
import expensetracker.ControllerSpec
import org.http4s._
import org.http4s.implicits._

class HealthControllerSpec extends ControllerSpec {
  "A HealthController" when {
    "GET /health/status" should {
      "return 200" in {
        val controller = new HealthController[IO]

        val request  = Request[IO](uri = uri"/health/status", method = Method.GET)
        val response = controller.routes.orNotFound.run(request)

        verifyJsonResponse(response, Status.Ok, Some("""{"status": true}"""))
      }
    }
  }
}
