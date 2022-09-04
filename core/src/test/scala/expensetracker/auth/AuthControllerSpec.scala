package expensetracker.auth

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.user.*
import expensetracker.auth.session.{CreateSession, SessionId, SessionService}
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.common.errors.AppError.{AccountAlreadyExists, InvalidEmailOrPassword, SessionDoesNotExist}
import expensetracker.auth.jwt.BearerToken
import expensetracker.fixtures.{Sessions, Users}
import org.http4s.implicits.*
import org.http4s.{HttpDate, Method, Request, Status, Uri}
import squants.market.USD
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.{mock, verify, verifyNoInteractions, when}

class AuthControllerSpec extends ControllerSpec {

  "An AuthController" when {
    "GET /auth/user" should {
      "return current account" in {
        val (usrSvc, sessSvc, disp) = mocks

        when(usrSvc.find(any[UserId])).thenReturn(IO.pure(Users.user))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(uri"/auth/user", Method.GET)
        val res = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

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
        verify(usrSvc).find(Sessions.sess.userId)
        verifyNoInteractions(disp)
      }
    }

    "PUT /auth/user/:id/settings" should {
      "return error when id in path is different from id in session" in {
        val (usrSvc, sessSvc, disp) = mocks

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody =
          """{
            |"currency":{"code":"USD","symbol":"$"},
            |"hideFutureTransactions":false,
            |"darkMode":false
            |}""".stripMargin

        val req = requestWithAuthHeader(uri"/auth/user/60e70e87fb134e0c1a271122/settings", Method.PUT, body = Some(parseJson(reqBody)))
        val res = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"The current session belongs to a different user"}"""))
        verifyNoInteractions(usrSvc, sessSvc, disp)
      }

      "return 204 when after updating account settings" in {
        val (usrSvc, sessSvc, disp) = mocks

        when(usrSvc.updateSettings(any[UserId], any[UserSettings])).thenReturn(IO.unit)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody =
          """{
            |"currency":{"code":"USD","symbol":"$"},
            |"hideFutureTransactions":false,
            |"darkMode":false
            |}""".stripMargin

        val req = requestWithAuthHeader(
          Uri.unsafeFromString(s"/auth/user/${Users.uid1}/settings"),
          method = Method.PUT,
          body = Some(parseJson(reqBody))
        )
        val res = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(usrSvc).updateSettings(Users.uid1, UserSettings(USD, false, Some(false)))
        verifyNoInteractions(sessSvc, disp)
      }
    }

    "POST /auth/user/:id/password" should {
      "return error when id in path is different from id in session" in {
        val (usrSvc, sessSvc, disp) = mocks

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(
          uri"/auth/user/60e70e87fb134e0c1a271122/password",
          Method.POST,
          body = Some(parseJson("""{"newPassword":"new-pwd","currentPassword":"curr-pwd"}"""))
        )
        val res = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"The current session belongs to a different user"}"""))
        verifyNoInteractions(usrSvc, sessSvc, disp)
      }

      "return 204 when after updating account password" in {
        val (usrSvc, sessSvc, disp) = mocks

        when(usrSvc.changePassword(any[ChangePassword])).thenReturn(IO.unit)
        when(sessSvc.invalidateAll(any[UserId])).thenReturn(IO.unit)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(
          Uri.unsafeFromString(s"/auth/user/${Users.uid1}/password"),
          Method.POST,
          body = Some(parseJson("""{"newPassword":"new-pwd","currentPassword":"curr-pwd"}"""))
        )
        val res = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(usrSvc).changePassword(ChangePassword(Users.uid1, Password("curr-pwd"), Password("new-pwd")))
        verify(sessSvc).invalidateAll(Users.uid1)
        verifyNoInteractions(disp)
      }
    }

    "POST /auth/user" should {
      given auth: Authenticator[IO] = _ => IO.raiseError(new RuntimeException("shouldn't reach this"))
      "return bad request if email is already taken" in {
        val (usrSvc, sessSvc, disp) = mocks

        when(usrSvc.create(any[UserDetails], any[Password])).thenReturn(IO.raiseError(AccountAlreadyExists(UserEmail("foo@bar.com"))))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"pwd","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/user", method = Method.POST).withJsonBody(reqBody)
        val res     = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.Conflict,
          Some("""{"message":"An account with email foo@bar.com already exists"}""")
        )
        verify(usrSvc).create(
          UserDetails(UserEmail("foo@bar.com"), UserName("John", "Bloggs")),
          Password("pwd")
        )
        verifyNoInteractions(sessSvc, disp)
      }

      "return bad request when invalid request" in {
        val (usrSvc, sessSvc, disp) = mocks

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/user", method = Method.POST).withJsonBody(reqBody)
        val res     = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.UnprocessableEntity,
          Some("""{"message":"password must not be empty"}""")
        )
        verifyNoInteractions(usrSvc, sessSvc, disp)
      }

      "create new account and return 201" in {
        val (usrSvc, sessSvc, disp) = mocks

        when(usrSvc.create(any[UserDetails], any[Password])).thenReturn(IO.pure(Users.uid1))
        when(disp.dispatch(any[Action])).thenReturn(IO.unit)

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"pwd","firstName":"John","lastName":"Bloggs"}""")
        val req     = Request[IO](uri = uri"/auth/user", method = Method.POST).withJsonBody(reqBody)
        val res     = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Created, Some(s"""{"id":"${Users.uid1}"}"""))
        verify(usrSvc).create(
          UserDetails(UserEmail("foo@bar.com"), UserName("John", "Bloggs")),
          Password("pwd")
        )
        verify(disp).dispatch(Action.SetupNewUser(Users.uid1))
        verifyNoInteractions(sessSvc)
      }
    }

    "POST /auth/login" should {

      given auth: Authenticator[IO] = _ => IO.raiseError(new RuntimeException("shouldn't reach this"))

      "return 422 on invalid json" in {
        val (usrSvc, sessSvc, disp) = mocks

        val req = Request[IO](uri = uri"/auth/login", method = Method.POST).withEntity("""{foo}""")
        val res = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        val responseBody = """{"message":"Invalid message body: Could not decode expected \" got 'foo}' (line 1, column 2) json"}"""
        verifyJsonResponse(res, Status.UnprocessableEntity, Some(responseBody))
        verifyNoInteractions(usrSvc, sessSvc, disp)
      }

      "return bad req on parsing error" in {
        val (usrSvc, sessSvc, disp) = mocks

        val reqBody  = parseJson("""{"email":"foo","password":""}""")
        val res      = Request[IO](uri = uri"/auth/login", method = Method.POST).withJsonBody(reqBody)
        val response = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(res))

        val resBody = """{"message":"foo is not a valid email, password must not be empty"}"""
        verifyJsonResponse(response, Status.UnprocessableEntity, Some(resBody))
        verifyNoInteractions(usrSvc, sessSvc, disp)
      }

      "return unauthorized when invalid password or email" in {
        val (usrSvc, sessSvc, disp) = mocks

        when(usrSvc.login(any[Login])).thenReturn(IO.raiseError(InvalidEmailOrPassword))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"bar"}""")
        val req     = Request[IO](uri = uri"/auth/login", method = Method.POST).withJsonBody(reqBody)
        val res     = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Unauthorized, Some("""{"message":"Invalid email or password"}"""))
        verify(usrSvc).login(Login(UserEmail("foo@bar.com"), Password("bar")))
        verifyNoInteractions(sessSvc, disp)
      }

      "return bearer token on success" in {
        val (usrSvc, sessSvc, disp) = mocks

        when(usrSvc.login(any[Login])).thenReturn(IO.pure(Users.user))
        when(sessSvc.create(any[CreateSession])).thenReturn(IO.pure(BearerToken("token")))

        val reqBody = parseJson("""{"email":"foo@bar.com","password":"bar"}""")
        val req     = Request[IO](uri = uri"/auth/login", method = Method.POST).withJsonBody(reqBody)
        val res     = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Ok, Some(s"""{"access_token":"token","token_type":"Bearer"}"""))
        verify(usrSvc).login(Login(UserEmail("foo@bar.com"), Password("bar")))
        verify(sessSvc).create(any[CreateSession])
        verifyNoInteractions(disp)
      }
    }

    "POST /auth/logout" should {
      "return forbidden if auth header is missing" in {
        val (usrSvc, sessSvc, disp) = mocks

        given auth: Authenticator[IO] = _ => IO.raiseError(new RuntimeException("shouldn't reach this"))

        val req = Request[IO](uri = uri"/auth/logout", method = Method.POST)
        val res = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"Missing authorization header"}"""))
        verifyNoInteractions(usrSvc, sessSvc, disp)
      }

      "return forbidden if session does not exist" in {
        val (usrSvc, sessSvc, disp) = mocks

        given auth: Authenticator[IO] = (auth: BearerToken) => IO.raiseError(SessionDoesNotExist(Sessions.sid))

        val req = requestWithAuthHeader(uri"/auth/logout", method = Method.POST)
        val res = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some(s"""{"message":"Session with id ${Sessions.sid} does not exist"}"""))
        verifyNoInteractions(usrSvc, sessSvc, disp)
      }

      "delete session on success" in {
        val (usrSvc, sessSvc, disp) = mocks

        when(sessSvc.unauth(any[SessionId])).thenReturn(IO.unit)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(uri"/auth/logout", method = Method.POST)
        val res = AuthController.make[IO](usrSvc, sessSvc, disp).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(sessSvc).unauth(Sessions.sid)
        verifyNoInteractions(disp)
      }
    }

    def mocks: (UserService[IO], SessionService[IO], ActionDispatcher[IO]) =
      (mock[UserService[IO]], mock[SessionService[IO]], mock[ActionDispatcher[IO]])
  }
}
