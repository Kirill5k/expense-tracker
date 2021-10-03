package expensetracker

import cats.effect.IO
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec
import org.scalatestplus.mockito.MockitoSugar
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

trait CatsSpec extends AsyncWordSpec with Matchers with MockitoSugar with TestData {

  implicit val logger: Logger[IO]   = Slf4jLogger.getLogger[IO]
}
