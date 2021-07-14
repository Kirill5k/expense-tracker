package expensetracker.auth

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.user.{UserDetails, UserEmail, UserId, UserName, UserSettings, ChangePassword, Password}
import expensetracker.auth.session.{CreateSession, SessionId}
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.common.errors.AppError.{AccountAlreadyExists, InvalidEmailOrPassword}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.implicits._
import org.http4s.{HttpDate, Method, Request, ResponseCookie, Status}
import squants.market.USD

class AuthControllerSpec extends ControllerSpec {

  "An AuthController" when {
    "GET /auth/user" should {
      "return current account" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.findUser(any[UserId])).thenReturn(IO.pure(user))

        val req = Request[IO](uri = uri"/auth/user", method = Method.GET).addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody =
          """{
            |"id":"60e70e87fb134e0c1a271121",
            |"email":"email",
            |"firstName":"John",
            |"lastName":"Bloggs",
            |"settings":{"currency":{"code":"GBP","symbol":"£"},"hideFutureTransactions":false,"darkMode":null},
            |"registrationDate": "2021-06-01T00:00:00Z"
            |}""".stripMargin
        verifyJsonResponse(res, Status.Ok, Some(resBody))
        verify(svc).findUser(sess.userId)
        verifyZeroInteractions(disp)
      }
    }

    "PUT /auth/user/:id/settings" should {
      "return error when id in path is different from id in session" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val reqBody =
          """{
            |"currency":{"code":"USD","symbol":"$"},
            |"hideFutureTransactions":false,
            |"darkMode":false
            |}""".stripMargin

        val req = Request[IO](uri = uri"/auth/user/60e70e87fb134e0c1a271122/settings", method = Method.PUT)
          .withEntity(parseJson(reqBody))
          .addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"The current session belongs to a different user"}"""))
        verifyZeroInteractions(disp, svc)
      }

      "return 204 when after updating account settings" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.updateSettings(any[UserId], any[UserSettings])).thenReturn(IO.unit)

        val reqBody =
          """{
            |"currency":{"code":"USD","symbol":"$"},
            |"hideFutureTransactions":false,
            |"darkMode":false
            |}""".stripMargin

        val req = Request[IO](uri = uri"/auth/user/60e70e87fb134e0c1a271121/settings", method = Method.PUT)
          .withEntity(parseJson(reqBody))
          .addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).updateSettings(uid, UserSettings(USD, false, Some(false)))
        verifyZeroInteractions(disp)
      }
    }

    "POST /auth/user/:id/password" should {
      "return error when id in path is different from id in session" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val reqBody ="""{"newPassword":"new-pwd","currentPassword":"curr-pwd"}"""
        val req = Request[IO](uri = uri"/auth/user/60e70e87fb134e0c1a271122/password", method = Method.POST)
          .withEntity(parseJson(reqBody))
          .addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"The current session belongs to a different user"}"""))
        verifyZeroInteractions(disp, svc)
      }

      "return 204 when after updating account password" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.changePassword(any[ChangePassword])).thenReturn(IO.unit)
        when(svc.createSession(any[CreateSession])).thenReturn(IO.pure(sid2))

        val reqBody ="""{"newPassword":"new-pwd","currentPassword":"curr-pwd"}"""
        val req = Request[IO](uri = uri"/auth/user/60e70e87fb134e0c1a271121/password", method = Method.POST)
          .withEntity(parseJson(reqBody))
          .addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val sessCookie = ResponseCookie(
          "session-id",
          sid2.value,
          httpOnly = true,
          maxAge = Some(Long.MaxValue),
          expires = Some(HttpDate.MaxValue),
          path = Some("/")
        )
        verifyJsonResponse(res, Status.NoContent, None, List(sessCookie))
        verify(svc).changePassword(ChangePassword(uid, Password("curr-pwd"), Password("new-pwd")))
        verify(svc).createSession(any[CreateSession])
        verifyZeroInteractions(disp)
      }
    }

    "POST /auth/user" should {
      "return bad request if email is already taken" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.createUser(any[UserDetails], any[Password]))
          .thenReturn(IO.raiseError(AccountAlreadyExists(UserEmail("foo@bar.com"))))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"pwd","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/user", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.Conflict,
          Some("""{"message":"An account with email foo@bar.com already exists"}""")
        )
        verify(svc).createUser(
          UserDetails(UserEmail("foo@bar.com"), UserName("John", "Bloggs")),
          Password("pwd")
        )
        verifyZeroInteractions(disp)
      }

      "return bad request when invalid response" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/user", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.UnprocessableEntity,
          Some("""{"message":"Password must not be empty"}""")
        )
        verifyZeroInteractions(svc)
        verifyZeroInteractions(disp)
      }

      "create new account and return 201" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.createUser(any[UserDetails], any[Password])).thenReturn(IO.pure(uid))
        when(disp.dispatch(any[Action])).thenReturn(IO.unit)

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"pwd","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/user", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.Created, Some(s"""{"id":"${uid.value}"}"""))
        verify(svc).createUser(
          UserDetails(UserEmail("foo@bar.com"), UserName("John", "Bloggs")),
          Password("pwd")
        )
        verify(disp).dispatch(Action.SetupNewUser(uid))
      }
    }

    "POST /auth/login" should {

      "return bad request on invalid json" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]


        val req = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity("""{foo}""")
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        val responseBody = """{"message":"Email is required"}"""
        verifyJsonResponse(res, Status.UnprocessableEntity, Some(responseBody))
        verifyZeroInteractions(svc)
        verifyZeroInteractions(disp)
      }

      "return bad req on parsing error" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]


        val reqBody  = parseJson("""{"email":"foo","password":""}""")
        val res      = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val response = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(res))

        val resBody = """{"message":"foo is not a valid email"}"""
        verifyJsonResponse(response, Status.UnprocessableEntity, Some(resBody))
        verifyZeroInteractions(svc)
        verifyZeroInteractions(disp)
      }

      "return unauthorized when invalid password or email" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.login(any[UserEmail], any[Password])).thenReturn(IO.raiseError(InvalidEmailOrPassword))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"bar"}""")
        val req     = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.Unauthorized, Some("""{"message":"Invalid email or password"}"""))
        verify(svc).login(eqTo(UserEmail("foo@bar.com")), eqTo(Password("bar")))
        verifyZeroInteractions(disp)
      }

      "return account on success and create session id cookie" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.login(any[UserEmail], any[Password])).thenReturn(IO.pure(user))
        when(svc.createSession(any[CreateSession])).thenReturn(IO.pure(sid))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"bar"}""")
        val req     = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        val resBody =
          """{
            |"id":"60e70e87fb134e0c1a271121",
            |"email":"email",
            |"firstName":"John",
            |"lastName":"Bloggs",
            |"settings":{"currency":{"code":"GBP","symbol":"£"},"hideFutureTransactions":false,"darkMode":null},
            |"registrationDate": "2021-06-01T00:00:00Z"
            |}""".stripMargin
        val sessCookie = ResponseCookie(
          "session-id",
          sid.value,
          httpOnly = true,
          maxAge = Some(Long.MaxValue),
          expires = Some(HttpDate.MaxValue),
          path = Some("/")
        )
        verifyJsonResponse(res, Status.Ok, Some(resBody), List(sessCookie))
        verify(svc).login(UserEmail("foo@bar.com"), Password("bar"))
        verify(svc).createSession(any[CreateSession])
        verifyZeroInteractions(disp)
      }
    }

    "POST /auth/logout" should {
      "return forbidden if session id cookie is missing" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"missing session-id cookie"}"""))
        verifyZeroInteractions(svc)
        verifyZeroInteractions(disp)
      }

      "return forbidden if session does not exist" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]


        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"invalid session-id"}"""))
        verifyZeroInteractions(svc)
        verifyZeroInteractions(disp)
      }

      "return forbidden if session is inactive" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]


        val exp = sess.copy(active = false)
        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(exp))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"session is inactive"}"""))
        verifyZeroInteractions(svc)
        verifyZeroInteractions(disp)
      }

      "return forbidden if session id is malformed" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]


        val req =
          Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessIdCookie.copy(content = "f"))
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"invalid session-id format"}"""))
        verifyZeroInteractions(svc)
        verifyZeroInteractions(disp)
      }

      "delete session on success" in {
        val svc = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.logout(any[SessionId])).thenReturn(IO.unit)

        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).logout(sid)
        verifyZeroInteractions(disp)
      }
    }
  }
}
