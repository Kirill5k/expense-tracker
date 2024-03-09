package expensetracker

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.auth.Authenticator
import expensetracker.auth.session.Session
import io.circe.parser.*
import io.circe.Json
import org.http4s.{EmptyBody, Header, Headers, Method, Request, Response, Status}
import org.scalatest.Assertion
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec
import org.scalatestplus.mockito.MockitoSugar
import org.typelevel.ci.CIString
import fs2.Stream

trait ControllerSpec extends AnyWordSpec with MockitoSugar with Matchers {

  extension (r: Request[IO]) def withJsonBody(json: Json): r.Self = r.withBodyStream(Stream.emits(json.noSpaces.getBytes().toList))

  def requestWithAuthHeader(
      uri: org.http4s.Uri,
      method: org.http4s.Method = Method.GET,
      authHeaderValue: String = "Bearer token",
      body: Option[Json] = None
  ): Request[IO] =
    Request[IO](
      uri = uri,
      method = method,
      headers = Headers(Header.Raw(CIString("authorization"), authHeaderValue)),
      body = body.map(b => Stream.emits(b.noSpaces.getBytes().toList)).getOrElse(EmptyBody)
    )

  def verifyJsonResponse(
      response: IO[Response[IO]],
      expectedStatus: Status,
      expectedBody: Option[String] = None
  ): Assertion =
    response
      .flatTap(res => IO(res.status mustBe expectedStatus))
      .flatMap { res =>
        expectedBody match {
          case Some(expectedJson) => res.as[String].map(parse(_) mustBe parse(expectedJson))
          case None               => res.body.compile.toVector.map(_ mustBe empty)
        }
      }
      .unsafeRunSync()

  extension (res: IO[Response[IO]])
    infix def mustHaveStatus(expectedStatus: Status, expectedBody: Option[String] = None): Assertion =
      verifyJsonResponse(res, expectedStatus, expectedBody)

  def parseJson(jsonString: String): Json =
    parse(jsonString).getOrElse(throw new RuntimeException)

  def failedAuth(error: Throwable): Authenticator[IO]      = _ => IO.raiseError(error)
  def successfulAuth(session: Session): Authenticator[IO] = _ => IO.pure(session)
}
