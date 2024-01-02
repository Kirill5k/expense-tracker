package expensetracker.common

import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec
import expensetracker.common.time.*

import java.time.Instant

class TimeSpec extends AnyWordSpec with Matchers {

  val ts = Instant.parse("2020-01-01T00:00:00Z")

  "A String extension" should {
    "convert str to instant" in {
      "2020-01-01".toInstant mustBe Right(ts)
      "2020-01-01T00:00:00".toInstant mustBe Right(ts)
      "2020-01-01T00:00:00Z".toInstant mustBe Right(ts)
      "foo".toInstant.left.map(_.getMessage) mustBe Left("Text 'foo' could not be parsed at index 0")
    }
  }

}

