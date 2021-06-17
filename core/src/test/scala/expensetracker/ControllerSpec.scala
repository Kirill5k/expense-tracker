package expensetracker

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.auth.session.{Session, SessionAuthMiddleware}
import io.circe.parser._
import io.circe.{Json, JsonObject}
import org.http4s.circe._
import org.http4s.server.AuthMiddleware
import org.http4s.{Response, ResponseCookie, Status}
import org.mockito.{ArgumentMatchersSugar, MockitoSugar}
import org.scalatest.Assertion
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

import scala.io.Source

trait ControllerSpec extends AnyWordSpec with MockitoSugar with ArgumentMatchersSugar with Matchers with TestData {

  implicit val logger: Logger[IO] = Slf4jLogger.getLogger[IO]

  val emptyJson: Json = Json.fromJsonObject(JsonObject.empty)

  def sessionMiddleware(sess: Option[Session]): AuthMiddleware[IO, Session] =
    SessionAuthMiddleware((_, _) => IO.pure(sess))

  def verifyJsonResponse(
      actual: IO[Response[IO]],
      expectedStatus: Status,
      expectedBody: Option[String] = None,
      expectedCookies: List[ResponseCookie] = Nil
  ): Assertion = {
    val actualResp = actual.unsafeRunSync()

    actualResp.status must be(expectedStatus)
    actualResp.cookies must contain allElementsOf expectedCookies
    expectedBody match {
      case Some(expected) =>
        val actual = actualResp.asJson.unsafeRunSync()
        actual mustBe parse(expected).getOrElse(throw new RuntimeException)
      case None =>
        actualResp.body.compile.toVector.unsafeRunSync() mustBe empty
    }
  }

  def readFileFromResources(path: String): String =
    Source.fromResource(path).getLines().toList.mkString

  def parseJson(jsonString: String): Json =
    parse(jsonString).getOrElse(throw new RuntimeException)
}
