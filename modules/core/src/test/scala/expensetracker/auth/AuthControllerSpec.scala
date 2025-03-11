package expensetracker.auth

import cats.effect.IO
import expensetracker.auth.jwt.BearerToken
import expensetracker.auth.session.{CreateSession, Session, SessionId, SessionService}
import expensetracker.auth.user.*
import expensetracker.common.errors.AppError.{UserAlreadyExists, InvalidEmailOrPassword, SessionDoesNotExist}
import expensetracker.fixtures.{Sessions, Users}
import kirill5k.common.http4s.test.HttpRoutesWordSpec
import org.http4s.implicits.*
import org.http4s.{Method, Request, Status, Uri}
import squants.market.{GBP, USD}

class AuthControllerSpec extends HttpRoutesWordSpec {

  "An AuthController" when {
    "GET /auth/user" should {
      "return current account" in {
        val (usrSvc, sessSvc) = mocks

        when(usrSvc.find(any[UserId])).thenReturnIO(Users.user)

        given auth: Authenticator[IO] = successfulAuth(Sessions.sess)

        val req = Request[IO](Method.GET, uri"/auth/user").withAuthHeader()
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        val resBody = s"""{
            |"id":"${Users.uid1}",
            |"email":"${Users.email}",
            |"firstName":"${Users.details.name.first}",
            |"lastName":"${Users.details.name.last}",
            |"settings":{
            |   "currency":{"code":"GBP","symbol":"£"},
            |   "hideFutureTransactions":false,
            |   "darkMode":null,
            |   "futureTransactionVisibilityDays": null
            |},
            |"registrationDate": "${Users.regDate}",
            |"categories": null,
            |"totalTransactionCount": null
            |}""".stripMargin

        res mustHaveStatus (Status.Ok, Some(resBody))
        verify(usrSvc).find(Sessions.sess.userId)
      }
    }

    "PUT /auth/user/:id/settings" should {
      "return error when id in path is different from id in session" in {
        val (usrSvc, sessSvc) = mocks

        given auth: Authenticator[IO] = successfulAuth(Sessions.sess)

        val req = Request[IO](Method.PUT, uri"/auth/user/60e70e87fb134e0c1a271122/settings")
          .withAuthHeader()
          .withBody("""{
              |"currency":{"code":"USD","symbol":"$"},
              |"hideFutureTransactions":false,
              |"darkMode":false
              |}""".stripMargin)
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Forbidden, Some("""{"message":"The current session belongs to a different user"}"""))
        verifyNoInteractions(usrSvc, sessSvc)
      }

      "return 204 when after updating account settings" in {
        val (usrSvc, sessSvc) = mocks

        when(usrSvc.updateSettings(any[UserId], any[UserSettings])).thenReturn(IO.unit)

        given auth: Authenticator[IO] = successfulAuth(Sessions.sess)

        val req = Request[IO](Method.PUT, Uri.unsafeFromString(s"/auth/user/${Users.uid1}/settings"))
          .withAuthHeader()
          .withBody("""{
              |"currency":{"code":"USD","symbol":"$"},
              |"hideFutureTransactions":false,
              |"futureTransactionVisibilityDays": 7,
              |"darkMode":false
              |}""".stripMargin)
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.NoContent, None)
        verify(usrSvc).updateSettings(Users.uid1, UserSettings(USD, false, Some(false), Some(7)))
        verifyNoInteractions(sessSvc)
      }
    }

    "POST /auth/user/:id/password" should {
      "return error when id in path is different from id in session" in {
        val (usrSvc, sessSvc) = mocks

        given auth: Authenticator[IO] = successfulAuth(Sessions.sess)

        val req = Request[IO](Method.POST, uri"/auth/user/60e70e87fb134e0c1a271122/password")
          .withAuthHeader()
          .withBody("""{"newPassword":"new-pwd","currentPassword":"curr-pwd"}""")
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Forbidden, Some("""{"message":"The current session belongs to a different user"}"""))
        verifyNoInteractions(usrSvc, sessSvc)
      }

      "return 204 when after updating account password" in {
        val (usrSvc, sessSvc) = mocks

        when(usrSvc.changePassword(any[ChangePassword])).thenReturn(IO.unit)
        when(sessSvc.invalidateAll(any[UserId])).thenReturn(IO.unit)

        given auth: Authenticator[IO] = successfulAuth(Sessions.sess)

        val req = Request[IO](Method.POST, Uri.unsafeFromString(s"/auth/user/${Users.uid1}/password"))
          .withAuthHeader()
          .withBody("""{"newPassword":"new-pwd","currentPassword":"curr-pwd"}""")
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.NoContent, None)
        verify(usrSvc).changePassword(ChangePassword(Users.uid1, Password("curr-pwd"), Password("new-pwd")))
        verify(sessSvc).invalidateAll(Users.uid1)
      }
    }

    "POST /auth/user" should {
      given auth: Authenticator[IO] = _ => IO.raiseError(new RuntimeException("shouldn't reach this"))
      "return bad request if email is already taken" in {
        val (usrSvc, sessSvc) = mocks

        when(usrSvc.create(any[UserDetails], any[Password])).thenRaiseError(UserAlreadyExists(UserEmail("foo@bar.com")))

        val req = Request[IO](Method.POST, uri"/auth/user")
          .withBody("""{
              |"email":"foo@bar.com",
              |"password":"pwd",
              |"firstName":"John",
              |"lastName":"Bloggs",
              |"currency":{"code":"GBP","symbol":"£"}
              |}""".stripMargin)
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Conflict, Some("""{"message":"A user with email foo@bar.com already exists"}"""))
        verify(usrSvc).create(
          UserDetails(UserEmail("foo@bar.com"), UserName("John", "Bloggs"), GBP),
          Password("pwd")
        )
        verifyNoInteractions(sessSvc)
      }

      "return bad request when invalid request" in {
        val (usrSvc, sessSvc) = mocks

        val req = Request[IO](Method.POST, uri"/auth/user")
          .withBody("""{"email":"foo@bar.com","password":"","firstName":"John","lastName":"Bloggs"}""")
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.UnprocessableEntity, Some("""{"message":"password must not be empty, currency is required"}"""))
        verifyNoInteractions(usrSvc, sessSvc)
      }

      "create new account and return 201" in {
        val (usrSvc, sessSvc) = mocks

        when(usrSvc.create(any[UserDetails], any[Password])).thenReturnIO(Users.uid1)

        val req = Request[IO](Method.POST, uri"/auth/user")
          .withBody("""{
              |"email":"foo@bar.com",
              |"password":"pwd",
              |"firstName":"John",
              |"lastName":"Bloggs",
              |"currency":{"code":"GBP","symbol":"£"}
              |}""".stripMargin)
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Created, Some(s"""{"id":"${Users.uid1}"}"""))
        verify(usrSvc).create(
          UserDetails(UserEmail("foo@bar.com"), UserName("John", "Bloggs"), GBP),
          Password("pwd")
        )
        verifyNoInteractions(sessSvc)
      }
    }

    "POST /auth/login" should {

      given auth: Authenticator[IO] = _ => IO.raiseError(new RuntimeException("shouldn't reach this"))

      "return 422 on invalid json" in {
        val (usrSvc, sessSvc) = mocks

        val req = Request[IO](Method.POST, uri"/auth/login").withBody("""{foo}""")
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        val responseBody = """{"message":"Invalid message body: Could not decode expected \" got 'foo}' (line 1, column 2) json"}"""
        res mustHaveStatus (Status.UnprocessableEntity, Some(responseBody))
        verifyNoInteractions(usrSvc, sessSvc)
      }

      "return bad req on parsing error" in {
        val (usrSvc, sessSvc) = mocks

        val req = Request[IO](Method.POST, uri"/auth/login").withBody("""{"email":"foo","password":""}""")
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        val resBody = """{"message":"foo is not a valid email, password must not be empty"}"""
        res mustHaveStatus (Status.UnprocessableEntity, Some(resBody))
        verifyNoInteractions(usrSvc, sessSvc)
      }

      "return unauthorized when invalid password or email" in {
        val (usrSvc, sessSvc) = mocks

        when(usrSvc.login(any[Login])).thenRaiseError(InvalidEmailOrPassword)

        val req = Request[IO](Method.POST, uri"/auth/login")
          .withBody("""{"email":"foo@bar.com","password":"bar"}""")
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Unauthorized, Some("""{"message":"Invalid email or password"}"""))
        verify(usrSvc).login(Login(UserEmail("foo@bar.com"), Password("bar")))
        verifyNoInteractions(sessSvc)
      }

      "return bearer token on success" in {
        val (usrSvc, sessSvc) = mocks

        when(usrSvc.login(any[Login])).thenReturnIO(Users.user)
        when(sessSvc.create(any[CreateSession])).thenReturnIO(BearerToken("token"))

        val req = Request[IO](Method.POST, uri"/auth/login")
          .withBody("""{"email":"foo@bar.com","password":"bar"}""")
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Ok, Some(s"""{"access_token":"token","token_type":"Bearer"}"""))
        verify(usrSvc).login(Login(UserEmail("foo@bar.com"), Password("bar")))
        verify(sessSvc).create(any[CreateSession])
      }
    }

    "POST /auth/logout" should {
      "return forbidden if auth header is missing" in {
        val (usrSvc, sessSvc) = mocks

        given auth: Authenticator[IO] = _ => IO.raiseError(new RuntimeException("shouldn't reach this"))

        val req = Request[IO](Method.POST, uri"/auth/logout")
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Forbidden, Some("""{"message":"Missing authorization header"}"""))
        verifyNoInteractions(usrSvc, sessSvc)
      }

      "return forbidden if session does not exist" in {
        val (usrSvc, sessSvc) = mocks

        given auth: Authenticator[IO] = (auth: BearerToken) => IO.raiseError(SessionDoesNotExist(Sessions.sid))

        val req = Request[IO](Method.POST, uri"/auth/logout").withAuthHeader()
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Forbidden, Some(s"""{"message":"Session with id ${Sessions.sid} does not exist"}"""))
        verifyNoInteractions(usrSvc, sessSvc)
      }

      "delete session on success" in {
        val (usrSvc, sessSvc) = mocks

        when(sessSvc.unauth(any[SessionId])).thenReturn(IO.unit)

        given auth: Authenticator[IO] = successfulAuth(Sessions.sess)

        val req = Request[IO](Method.POST, uri"/auth/logout").withAuthHeader()
        val res = AuthController.make[IO](usrSvc, sessSvc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.NoContent, None)
        verify(sessSvc).unauth(Sessions.sid)
      }
    }

    def mocks: (UserService[IO], SessionService[IO]) =
      (mock[UserService[IO]], mock[SessionService[IO]])
  }

  def failedAuth(error: Throwable): Authenticator[IO]     = _ => IO.raiseError(error)
  def successfulAuth(session: Session): Authenticator[IO] = _ => IO.pure(session)
}
