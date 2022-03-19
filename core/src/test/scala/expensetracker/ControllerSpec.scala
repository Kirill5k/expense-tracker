package expensetracker

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.auth.jwt.BearerToken
import expensetracker.auth.session.{Session, SessionAuth}
import expensetracker.fixtures.Sessions
import io.circe.parser.*
import io.circe.{Json, JsonObject}
import org.http4s.circe.*
import org.http4s.server.AuthMiddleware
import org.http4s.{Header, Headers, Method, Request, RequestCookie, Response, ResponseCookie, Status}
import org.scalatest.Assertion
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec
import org.scalatestplus.mockito.MockitoSugar
import org.typelevel.ci.CIString
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

import scala.io.Source

trait ControllerSpec extends AnyWordSpec with MockitoSugar with Matchers {

  val sessIdCookie = RequestCookie("session-id", Sessions.sid.value)

  given logger: Logger[IO] = Slf4jLogger.getLogger[IO]

  def requestWithAuthHeader(
      uri: org.http4s.Uri,
      method: org.http4s.Method = Method.GET,
      bearerToken: String = "token"
  ): Request[IO] =
    Request[IO](uri = uri, method = method, headers = Headers(Header.Raw(CIString("authorization"), s"Bearer $bearerToken")))

  def sessMiddleware(sess: Option[Session]): AuthMiddleware[IO, Session] =
    SessionAuth.middleware(_ => IO.pure(sess))

  def verifyJsonResponse(
      response: IO[Response[IO]],
      expectedStatus: Status,
      expectedBody: Option[String] = None,
      expectedCookies: List[ResponseCookie] = Nil
  ): Assertion =
    response
      .flatTap { res =>
        IO {
          res.status mustBe expectedStatus
          res.cookies must contain allElementsOf expectedCookies
        }
      }
      .flatMap { res =>
        expectedBody match {
          case Some(expectedJson) => res.as[String].map(parse(_) mustBe parse(expectedJson))
          case None               => res.body.compile.toVector.map(_ mustBe empty)
        }
      }
      .unsafeRunSync()

  def readFileFromResources(path: String): String =
    Source.fromResource(path).getLines().toList.mkString

  def parseJson(jsonString: String): Json =
    parse(jsonString).getOrElse(throw new RuntimeException)
}
