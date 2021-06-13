package expensetracker.auth

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.session.SessionId
import org.http4s.implicits._
import org.http4s.{Method, Request, Status}

import java.time.Instant

class AuthControllerSpec extends ControllerSpec {

  "An AuthController" when {
    "POST /auth/accounts" should {

    }

    "POST /auth/login" should {

    }

    "POST /auth/logout" should {
      "return forbidden if session id cookie is missing" in {
        val svc = mock[AuthService[IO]]

        val request = Request[IO](uri = uri"/auth/logout", method = Method.POST)
        val response = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(request))

        verifyJsonResponse(response, Status.Forbidden, Some("""{"message":"missing session-id cookie"}"""))
        verifyZeroInteractions(svc)
      }

      "return forbidden if session does not exist" in {
        val svc = mock[AuthService[IO]]

        val request = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie)
        val response = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(request))

        verifyJsonResponse(response, Status.Forbidden, Some("""{"message":"invalid session-id"}"""))
        verifyZeroInteractions(svc)
      }

      "return forbidden if session has expired" in {
        val svc = mock[AuthService[IO]]

        val expiredSession = sess.copy(expiresAt = Instant.now().minusSeconds(10L))
        val request = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie)
        val response = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(expiredSession))).orNotFound.run(request))

        verifyJsonResponse(response, Status.Forbidden, Some("""{"message":"session has expired"}"""))
        verifyZeroInteractions(svc)
      }

      "return forbidden if session id is malformed" in {
        val svc = mock[AuthService[IO]]

        val request = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie.copy(content = "foo"))
        val response = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(request))

        verifyJsonResponse(response, Status.Forbidden, Some("""{"message":"invalid session-id format"}"""))
        verifyZeroInteractions(svc)
      }

      "delete session on success" in {
        val svc = mock[AuthService[IO]]
        when(svc.logout(any[SessionId])).thenReturn(IO.unit)

        val request = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie)
        val response = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(request))

        verifyJsonResponse(response, Status.NoContent, None)
        verify(svc).logout(sid)
      }
    }
  }
}
