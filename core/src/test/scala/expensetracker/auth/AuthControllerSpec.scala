package expensetracker.auth

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.account.{AccountEmail, Password}
import expensetracker.auth.session.SessionId
import io.circe.Json
import io.circe.parser._
import org.http4s.circe.CirceEntityCodec._
import org.http4s.implicits._
import org.http4s.{Method, Request, ResponseCookie, Status}

import java.time.Instant
import scala.concurrent.duration._

class AuthControllerSpec extends ControllerSpec {

  "An AuthController" when {
    "POST /auth/accounts" should {}

    "POST /auth/login" should {

      "return bad request on invalid json" in {
        val svc = mock[AuthService[IO]]

        val request  = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity("""{foo}""")
        val response = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(request))

        val responseBody = """{"message":"Attempt to decode value on failed cursor: Field(email)"}"""
        verifyJsonResponse(response, Status.BadRequest, Some(responseBody))
        verifyZeroInteractions(svc)
      }

      "return bad request on parsing error" in {
        val svc = mock[AuthService[IO]]

        val requestBody = parse("""{"email":"foo","password":"","isExtended":true}""").getOrElse[Json](emptyJson)
        val request     = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(requestBody)
        val response = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(request))

        val responseBody =
          """{"message":"Validation failed: \"foo\".matches(\"^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\\.[a-zA-Z]+$\").: Field(email)"}"""
        verifyJsonResponse(response, Status.BadRequest, Some(responseBody))
        verifyZeroInteractions(svc)
      }

      "return no content on success and create session id cookie" in {
        val svc = mock[AuthService[IO]]
        when(svc.login(any[AccountEmail], any[Password], any[FiniteDuration])).thenReturn(IO.pure(sid))

        val requestBody =
          parse("""{"email":"foo@bar.com","password":"bar","isExtended":true}""").getOrElse[Json](emptyJson)
        val request  = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(requestBody)
        val response = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(request))

        verifyJsonResponse(response, Status.NoContent, None, List(ResponseCookie("session-id", sid.value)))
        verify(svc).login(AccountEmail("foo@bar.com"), Password("bar"), 90.days)
      }
    }

    "POST /auth/logout" should {
      "return forbidden if session id cookie is missing" in {
        val svc = mock[AuthService[IO]]

        val request = Request[IO](uri = uri"/auth/logout", method = Method.POST)
        val response =
          AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(request))

        verifyJsonResponse(response, Status.Forbidden, Some("""{"message":"missing session-id cookie"}"""))
        verifyZeroInteractions(svc)
      }

      "return forbidden if session does not exist" in {
        val svc = mock[AuthService[IO]]

        val request  = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie)
        val response = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(request))

        verifyJsonResponse(response, Status.Forbidden, Some("""{"message":"invalid session-id"}"""))
        verifyZeroInteractions(svc)
      }

      "return forbidden if session has expired" in {
        val svc = mock[AuthService[IO]]

        val expiredSession = sess.copy(expiresAt = Instant.now().minusSeconds(10L))
        val request        = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie)
        val response = AuthController
          .make[IO](svc)
          .flatMap(_.routes(sessionMiddleware(Some(expiredSession))).orNotFound.run(request))

        verifyJsonResponse(response, Status.Forbidden, Some("""{"message":"session has expired"}"""))
        verifyZeroInteractions(svc)
      }

      "return forbidden if session id is malformed" in {
        val svc = mock[AuthService[IO]]

        val request =
          Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie.copy(content = "foo"))
        val response =
          AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(request))

        verifyJsonResponse(response, Status.Forbidden, Some("""{"message":"invalid session-id format"}"""))
        verifyZeroInteractions(svc)
      }

      "delete session on success" in {
        val svc = mock[AuthService[IO]]
        when(svc.logout(any[SessionId])).thenReturn(IO.unit)

        val request = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie)
        val response =
          AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(request))

        verifyJsonResponse(response, Status.NoContent, None)
        verify(svc).logout(sid)
      }
    }
  }
}
