package expensetracker.auth

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.user.{ChangePassword, Password, UserDetails, UserEmail, UserId, UserName, UserSettings}
import expensetracker.auth.session.{CreateSession, SessionId}
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.common.errors.AppError.{AccountAlreadyExists, InvalidEmailOrPassword}
import expensetracker.fixtures.{Sessions, Users}
import org.http4s.circe.CirceEntityCodec.*
import org.http4s.implicits.*
import org.http4s.{HttpDate, Method, Request, ResponseCookie, Status, Uri}
import squants.market.USD
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.{verify, verifyNoInteractions, when}

class AuthControllerSpec extends ControllerSpec {

  "An AuthController" when {
    "GET /auth/user" should {
      "return current account" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.findUser(any[UserId])).thenReturn(IO.pure(Users.user))

        val req = Request[IO](uri = uri"/auth/user", method = Method.GET).addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(Sessions.sess))).orNotFound.run(req))

        val resBody =
          s"""{
            |"id":"${Users.uid1}",
            |"email":"${Users.email}",
            |"firstName":"${Users.details.name.first}",
            |"lastName":"${Users.details.name.last}",
            |"settings":{"currency":{"code":"GBP","symbol":"£"},"hideFutureTransactions":false,"darkMode":null},
            |"registrationDate": "${Users.regDate}"
            |}""".stripMargin

        verifyJsonResponse(res, Status.Ok, Some(resBody))
        verify(svc).findUser(Sessions.sess.userId)
        verifyNoInteractions(disp)
      }
    }

    "PUT /auth/user/:id/settings" should {
      "return error when id in path is different from id in session" in {
        val svc  = mock[AuthService[IO]]
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
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(Sessions.sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"The current session belongs to a different user"}"""))
        verifyNoInteractions(disp, svc)
      }

      "return 204 when after updating account settings" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.updateSettings(any[UserId], any[UserSettings])).thenReturn(IO.unit)

        val reqBody =
          """{
            |"currency":{"code":"USD","symbol":"$"},
            |"hideFutureTransactions":false,
            |"darkMode":false
            |}""".stripMargin

        val req = Request[IO](uri = Uri.unsafeFromString(s"/auth/user/${Users.uid1}/settings"), method = Method.PUT)
          .withEntity(parseJson(reqBody))
          .addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(Sessions.sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).updateSettings(Users.uid1, UserSettings(USD, false, Some(false)))
        verifyNoInteractions(disp)
      }
    }

    "POST /auth/user/:id/password" should {
      "return error when id in path is different from id in session" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val reqBody = """{"newPassword":"new-pwd","currentPassword":"curr-pwd"}"""
        val req = Request[IO](uri = uri"/auth/user/60e70e87fb134e0c1a271122/password", method = Method.POST)
          .withEntity(parseJson(reqBody))
          .addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(Sessions.sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"The current session belongs to a different user"}"""))
        verifyNoInteractions(disp, svc)
      }

      "return 204 when after updating account password" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.changePassword(any[ChangePassword])).thenReturn(IO.unit)
        when(svc.createSession(any[CreateSession])).thenReturn(IO.pure(Sessions.sid2))

        val reqBody = """{"newPassword":"new-pwd","currentPassword":"curr-pwd"}"""
        val req = Request[IO](uri = Uri.unsafeFromString(s"/auth/user/${Users.uid1}/password"), method = Method.POST)
          .withEntity(parseJson(reqBody))
          .addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(Sessions.sess))).orNotFound.run(req))

        val sessCookie = ResponseCookie(
          "session-id",
          Sessions.sid2.value,
          httpOnly = true,
          maxAge = Some(Long.MaxValue),
          expires = Some(HttpDate.MaxValue),
          path = Some("/")
        )
        verifyJsonResponse(res, Status.NoContent, None, List(sessCookie))
        verify(svc).changePassword(ChangePassword(Users.uid1, Password("curr-pwd"), Password("new-pwd")))
        verify(svc).createSession(any[CreateSession])
        verifyNoInteractions(disp)
      }
    }

    "POST /auth/user" should {
      "return bad request if email is already taken" in {
        val svc  = mock[AuthService[IO]]
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
        verifyNoInteractions(disp)
      }

      "return bad request when invalid request" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/user", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.UnprocessableEntity,
          Some("""{"message":"Password must not be empty"}""")
        )
        verifyNoInteractions(svc)
        verifyNoInteractions(disp)
      }

      "create new account and return 201" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.createUser(any[UserDetails], any[Password])).thenReturn(IO.pure(Users.uid1))
        when(disp.dispatch(any[Action])).thenReturn(IO.unit)

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"pwd","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/user", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.Created, Some(s"""{"id":"${Users.uid1}"}"""))
        verify(svc).createUser(
          UserDetails(UserEmail("foo@bar.com"), UserName("John", "Bloggs")),
          Password("pwd")
        )
        verify(disp).dispatch(Action.SetupNewUser(Users.uid1))
      }
    }

    "POST /auth/login" should {

      "return 422 on invalid json" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val req = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity("""{foo}""")
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        val responseBody = """{"message":"Invalid message body: Could not decode JSON: \"{foo}\""}"""
        verifyJsonResponse(res, Status.UnprocessableEntity, Some(responseBody))
        verifyNoInteractions(svc, disp)
      }

      "return bad req on parsing error" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val reqBody  = parseJson("""{"email":"foo","password":""}""")
        val res      = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val response = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(res))

        val resBody = """{"message":"foo is not a valid email"}"""
        verifyJsonResponse(response, Status.UnprocessableEntity, Some(resBody))
        verifyNoInteractions(svc, disp)
      }

      "return unauthorized when invalid password or email" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.login(any[UserEmail], any[Password]))
          .thenReturn(IO.raiseError(InvalidEmailOrPassword))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"bar"}""")
        val req     = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.Unauthorized, Some("""{"message":"Invalid email or password"}"""))
        verify(svc).login(UserEmail("foo@bar.com"), Password("bar"))
        verifyNoInteractions(disp)
      }

      "return account on success and create session id cookie" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.login(any[UserEmail], any[Password])).thenReturn(IO.pure(Users.user))
        when(svc.createSession(any[CreateSession])).thenReturn(IO.pure(Sessions.sid))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"bar"}""")
        val req     = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity(reqBody)
        val res     = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        val resBody =
          s"""{
             |"id":"${Users.uid1}",
             |"email":"${Users.email}",
             |"firstName":"${Users.details.name.first}",
             |"lastName":"${Users.details.name.last}",
             |"settings":{"currency":{"code":"GBP","symbol":"£"},"hideFutureTransactions":false,"darkMode":null},
             |"registrationDate": "${Users.regDate}"
             |}""".stripMargin
        val sessCookie = ResponseCookie(
          "session-id",
          Sessions.sid.value,
          httpOnly = true,
          maxAge = Some(Long.MaxValue),
          expires = Some(HttpDate.MaxValue),
          path = Some("/")
        )
        verifyJsonResponse(res, Status.Ok, Some(resBody), List(sessCookie))
        verify(svc).login(UserEmail("foo@bar.com"), Password("bar"))
        verify(svc).createSession(any[CreateSession])
        verifyNoInteractions(disp)
      }
    }

    "POST /auth/logout" should {
      "return forbidden if session id cookie is missing" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(Sessions.sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"missing session-id cookie"}"""))
        verifyNoInteractions(svc, disp)
      }

      "return forbidden if session does not exist" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(None)).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"invalid session-id"}"""))
        verifyNoInteractions(svc, disp)
      }

      "return forbidden if session is inactive" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val exp = Sessions.sess.copy(active = false)
        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(exp))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"session is inactive"}"""))
        verifyNoInteractions(svc, disp)
      }

      "return forbidden if session id is malformed" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST)
          .addCookie(sessIdCookie.copy(content = "f"))
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(Sessions.sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"invalid session-id format"}"""))
        verifyNoInteractions(svc, disp)
      }

      "delete session on success" in {
        val svc  = mock[AuthService[IO]]
        val disp = mock[ActionDispatcher[IO]]

        when(svc.logout(any[SessionId])).thenReturn(IO.unit)

        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST).addCookie(sessIdCookie)
        val res = AuthController.make[IO](svc, disp).flatMap(_.routes(sessMiddleware(Some(Sessions.sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).logout(Sessions.sid)
        verifyNoInteractions(disp)
      }
    }
  }
}
