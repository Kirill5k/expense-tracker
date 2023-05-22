package expensetracker.common

import expensetracker.auth.session.SessionId
import io.circe.parser.*
import io.circe.syntax.*
import org.scalatest.wordspec.AnyWordSpec
import org.scalatest.matchers.must.Matchers
import squants.Money
import squants.market.GBP

class JsonCodecsSpec extends AnyWordSpec with Matchers with JsonCodecs {

  "Money codec" should {

    "convert json to money" in {
      val money = """{"currency":{"code":"GBP"},"value":1}"""
      decode[Money](money) mustBe Right(GBP(BigDecimal(1.00)))
    }

    "convert money to json" in {
      GBP(BigDecimal(1)).asJson.noSpaces mustBe """{"value":1.00,"currency":{"code":"GBP","symbol":"£"}}"""
    }
  }

  "Id codec" should {
    "decode and encode ids" in {
      val id   = SessionId("FOO")
      val json = id.asJson.noSpaces

      json mustBe """"FOO""""
      decode[SessionId](json) mustBe Right(id)
    }
  }
}
