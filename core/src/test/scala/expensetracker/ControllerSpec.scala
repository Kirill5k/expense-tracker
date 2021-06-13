package expensetracker

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.auth.account.AccountId
import expensetracker.auth.session.{Session, SessionAuthMiddleware, SessionId}
import io.circe.{Json, JsonObject}
import io.circe.parser._
import org.bson.types.ObjectId
import org.http4s.circe._
import org.http4s.server.AuthMiddleware
import org.http4s.{RequestCookie, Response, ResponseCookie, Status}
import org.mockito.{ArgumentMatchersSugar, MockitoSugar}
import org.scalatest.Assertion
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

import java.time.Instant
import scala.io.Source

trait ControllerSpec extends AnyWordSpec with MockitoSugar with ArgumentMatchersSugar with Matchers {

  implicit val logger: Logger[IO] = Slf4jLogger.getLogger[IO]

  val emptyJson: Json = Json.fromJsonObject(JsonObject.empty)

  val aid             = AccountId(new ObjectId().toHexString)
  val sid             = SessionId(new ObjectId().toHexString)
  val sess            = Session(sid, aid, Instant.now(), Instant.now().plusSeconds(100000L))
  val sessionIdCookie = RequestCookie("session-id", sid.value)

  def sessionMiddleware(sess: Option[Session]): AuthMiddleware[IO, Session] =
    SessionAuthMiddleware(_ => IO.pure(sess))

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
        actual must be(parse(expected).getOrElse(throw new RuntimeException))
      case None =>
        actualResp.body.compile.toVector.unsafeRunSync() mustBe empty
    }
  }

  def readFileFromResources(path: String): String =
    Source.fromResource(path).getLines().toList.mkString
}
