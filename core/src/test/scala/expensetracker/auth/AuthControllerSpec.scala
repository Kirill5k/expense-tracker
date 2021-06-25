package expensetracker.auth

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.account.{AccountDetails, AccountEmail, AccountId, AccountName, Password}
import expensetracker.auth.session.{CreateSession, SessionId}
import expensetracker.common.errors.AppError.{AccountAlreadyExists, InvalidEmailOrPassword}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.implicits._
import org.http4s.{HttpDate, Method, Request, ResponseCookie, Status}

class AuthControllerSpec extends ControllerSpec {

  "An AuthController" when {
    "GET /auth/account" should {
      "return current account" in {
        val svc = mock[AuthService[IO]]
        when(svc.findAccount(any[AccountId])).thenReturn(IO.pure(acc))

        val req = Request[IO](uri = uri"/auth/account", method = Method.GET).addCookie(sessionIdCookie)
        val res = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """{"email":"email","firstName":"John","lastName":"Bloggs"}"""
        verifyJsonResponse(res, Status.Ok, Some(resBody))
        verify(svc).findAccount(sess.accountId)
      }
    }

    "POST /auth/account" should {
      "return bad request if email is already taken" in {
        val svc = mock[AuthService[IO]]
        when(svc.createAccount(any[AccountDetails], any[Password]))
          .thenReturn(IO.raiseError(AccountAlreadyExists(AccountEmail("foo@bar.com"))))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"pwd","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/account", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.Conflict,
          Some("""{"message":"account with email foo@bar.com already exists"}""")
        )
        verify(svc).createAccount(
          AccountDetails(AccountEmail("foo@bar.com"), AccountName("John", "Bloggs")),
          Password("pwd")
        )
      }

      "return bad request when invalid response" in {
        val svc = mock[AuthService[IO]]

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/account", method = Method.POST).withEntity(reqBody)
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
        val req     = Request[IO](uri = uri"/auth/account", method = Method.POST).withEntity(reqBody)
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

        val reqBody  = parseJson("""{"email":"foo","password":""}""")
        val res      = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val response = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(res))

        val resBody =
          """{"message":"Validation failed: \"foo\".matches(\"^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\\.[a-zA-Z]+$\").: Field(email)"}"""
        verifyJsonResponse(response, Status.UnprocessableEntity, Some(resBody))
        verifyZeroInteractions(svc)
      }

      "return forbidden when invalid password or email" in {
        val svc = mock[AuthService[IO]]
        when(svc.login(any[AccountEmail], any[Password])).thenReturn(IO.raiseError(InvalidEmailOrPassword))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"bar"}""")
        val req     = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"invalid email or password"}"""))
        verify(svc).login(eqTo(AccountEmail("foo@bar.com")), eqTo(Password("bar")))
      }

      "return account on success and create session id cookie" in {
        val svc = mock[AuthService[IO]]
        when(svc.login(any[AccountEmail], any[Password])).thenReturn(IO.pure(acc))
        when(svc.createSession(any[CreateSession])).thenReturn(IO.pure(sid))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"bar"}""")
        val req     = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(None)).orNotFound.run(req))

        val resBody = """{"email":"email","firstName":"John","lastName":"Bloggs"}"""
        val sessCookie =
          ResponseCookie("session-id", sid.value, maxAge = Some(Long.MaxValue), expires = Some(HttpDate.MaxValue))
        verifyJsonResponse(res, Status.Ok, Some(resBody), List(sessCookie))
        verify(svc).login(AccountEmail("foo@bar.com"), Password("bar"))
        verify(svc).createSession(any[CreateSession])
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

      "return forbidden if session is inactive" in {
        val svc = mock[AuthService[IO]]

        val exp = sess.copy(active = false)
        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessionIdCookie)
        val res = AuthController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(exp))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"session is inactive"}"""))
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
