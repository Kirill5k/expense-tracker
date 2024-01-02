package expensetracker.common

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import config.AppConfig
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec

class AppConfigSpec extends AsyncWordSpec with Matchers {

  System.setProperty("MONGO_HOST", "mongo")
  System.setProperty("MONGO_USER", "user")
  System.setProperty("MONGO_PASSWORD", "password")

  "An AppConfig" should {

    "load itself from reference.conf" in {
      val config = AppConfig.load[IO]

      config.unsafeToFuture().map { c =>
        c.server.host mustBe "0.0.0.0"
        c.mongo.connectionUri mustBe "mongodb+srv://user:password@mongo/expense-tracker"
      }
    }
  }
}
