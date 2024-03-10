package expensetracker.common

import cats.effect.IO
import config.AppConfig
import kirill5k.common.cats.test.IOWordSpec

class AppConfigSpec extends IOWordSpec {

  System.setProperty("MONGO_HOST", "mongo")
  System.setProperty("MONGO_USER", "user")
  System.setProperty("MONGO_PASSWORD", "password")

  "An AppConfig" should {

    "load itself from reference.conf" in {
      val config = AppConfig.load[IO]

      config.asserting { c =>
        c.server.host mustBe "0.0.0.0"
        c.mongo.connectionUri mustBe "mongodb+srv://user:password@mongo/expense-tracker"
      }
    }
  }
}
