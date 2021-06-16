package expensetracker.auth

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.account.{AccountDetails, AccountEmail, AccountName, Password}
import expensetracker.auth.session.SessionId
import expensetracker.common.errors.AppError.{AccountAlreadyExists, InvalidEmailOrPassword}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.implicits._
import org.http4s.{Method, Request, ResponseCookie, Status}

import java.time.Instant
import scala.concurrent.duration._

class AuthControllerSpec extends ControllerSpec {

  "An AuthController" when {
    "POST /auth/accounts" should {

      "return bad request if email is already taken" in {
        val svc = mock[AuthService[IO]]
        when(svc.createAccount(any[AccountDetails], any[Password]))
          .thenReturn(IO.raiseError(AccountAlreadyExists(AccountEmail("foo@bar.com"))))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"pwd","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/accounts", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.Conflict, Some("""{"message":"account with email foo@bar.com already exists"}"""))
        verify(svc).createAccount(
          AccountDetails(AccountEmail("foo@bar.com"), AccountName("John", "Bloggs")),
          Password("pwd")
        )
      }

      "return bad request when invalid response" in {
        val svc = mock[AuthService[IO]]

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/accounts", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.UnprocessableEntity,
          Some("""{"message":"Validation isEmpty() did not fail.: Field(password)"}""")
        )
        verifyZeroInteractions(svc)
      }

      "create new account and return 201" in {
        val svc = mock[AuthService[IO]]
        when(svc.createAccount(any[AccountDetails], any[Password])).thenReturn(IO.pure(aid))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"pwd","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/accounts", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.Created, Some(s"""{"id":"${aid.value}"}"""))
        verify(svc).createAccount(
          AccountDetails(AccountEmail("foo@bar.com"), AccountName("John", "Bloggs")),
          Password("pwd")
        )
      }
    }

    "POST /auth/login" should {

      "return bad request on invalid json" in {
        val svc = mock[AuthService[IO]]

        val req = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity("""{foo}""")
        val res = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(req))

        val responseBody = """{"message":"Attempt to decode value on failed cursor: Field(email)"}"""
        verifyJsonResponse(res, Status.UnprocessableEntity, Some(responseBody))
        verifyZeroInteractions(svc)
      }

      "return bad req on parsing error" in {
        val svc = mock[AuthService[IO]]

        val reqBody  = parseJson("""{"email":"foo","password":"","isExtended":true}""")
        val res      = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val response = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(res))

        val resBody =
          """{"message":"Validation failed: \"foo\".matches(\"^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\\.[a-zA-Z]+$\").: Field(email)"}"""
        verifyJsonResponse(response, Status.UnprocessableEntity, Some(resBody))
        verifyZeroInteractions(svc)
      }

      "return forbidden when invalid password or email" in {
        val svc = mock[AuthService[IO]]
        when(svc.login(any[AccountEmail], any[Password], any[FiniteDuration])).thenReturn(IO.raiseError(InvalidEmailOrPassword))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"bar","isExtended":true}""")
        val req     = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"invalid email or password"}"""))
        verify(svc).login(AccountEmail("foo@bar.com"), Password("bar"), 90.days)
      }

      "return no content on success and create session id cookie" in {
        val svc = mock[AuthService[IO]]
        when(svc.login(any[AccountEmail], any[Password], any[FiniteDuration])).thenReturn(IO.pure(sid))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"bar","isExtended":true}""")
        val req     = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None, List(ResponseCookie("session-id", sid.value)))
        verify(svc).login(AccountEmail("foo@bar.com"), Password("bar"), 90.days)
      }
    }

    "POST /auth/logout" should {
      "return forbidden if session id cookie is missing" in {
        val svc = mock[AuthService[IO]]

        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST)
        val res = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"missing session-id cookie"}"""))
        verifyZeroInteractions(svc)
      }

      "return forbidden if session does not exist" in {
        val svc = mock[AuthService[IO]]

        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie)
        val res = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"invalid session-id"}"""))
        verifyZeroInteractions(svc)
      }

      "return forbidden if session has expired" in {
        val svc = mock[AuthService[IO]]

        val exp = sess.copy(expiresAt = Instant.now().minusSeconds(10L))
        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie)
        val res = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(exp))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"session has expired"}"""))
        verifyZeroInteractions(svc)
      }

      "return forbidden if session id is malformed" in {
        val svc = mock[AuthService[IO]]

        val req =
          Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie.copy(content = "f"))
        val res = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"invalid session-id format"}"""))
        verifyZeroInteractions(svc)
      }

      "delete session on success" in {
        val svc = mock[AuthService[IO]]
        when(svc.logout(any[SessionId])).thenReturn(IO.unit)

        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie)
        val res = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).logout(sid)
      }
    }
  }
}
