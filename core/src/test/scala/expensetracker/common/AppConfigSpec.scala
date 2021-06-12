package expensetracker.common

import config.AppConfig
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

class AppConfigSpec extends AnyWordSpec with Matchers {

  System.setProperty("MONGO_HOST", "mongo")
  System.setProperty("MONGO_USER", "user")
  System.setProperty("MONGO_PASSWORD", "password")

  "An AppConfig" should {

    "load itself from reference.conf" in {

      val config = AppConfig.load
      config.server.host mustBe "0.0.0.0"
      config.mongo.connectionUri mustBe "mongodb+srv://user:password@mongo/expense-tracker"
    }
  }
}
