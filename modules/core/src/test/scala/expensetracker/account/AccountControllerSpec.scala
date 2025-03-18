package expensetracker.account

import cats.effect.IO
import expensetracker.auth.Authenticator
import expensetracker.auth.session.Session
import expensetracker.common.errors.AppError.{AccountAlreadyExists, ExpiredSession}
import expensetracker.fixtures.{Accounts, Sessions}
import kirill5k.common.http4s.test.HttpRoutesWordSpec
import org.http4s.{Method, Request, Status, Uri}
import org.http4s.implicits.*

class AccountControllerSpec extends HttpRoutesWordSpec:

  def failedAuth(error: Throwable): Authenticator[IO] = _ => IO.raiseError(error)
  def successfulAuth(session: Session): Authenticator[IO] = _ => IO.pure(session)

  "A AccountController" when {
    "Authentication fails" should {
      "return error when session has expired" in {
        val svc = mock[AccountService[IO]]

        given auth: Authenticator[IO] = failedAuth(ExpiredSession)

        val req = Request[IO](Method.GET, uri"/accounts").withAuthHeader()
        val res = AccountController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus(Status.Forbidden, Some("""{"message":"Session has expired"}"""))
        verifyNoInteractions(svc)
      }

      "return error empty bearer token" in {
        val svc = mock[AccountService[IO]]

        given auth: Authenticator[IO] = successfulAuth(Sessions.sess)

        val req = Request[IO](Method.GET, uri"/accounts").withAuthHeader("Bearer ")
        val res = AccountController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus(Status.Forbidden, Some("""{"message":"Invalid Bearer token"}"""))
        verifyNoInteractions(svc)
      }

      "return error on missing bearer token" in {
        val svc = mock[AccountService[IO]]

        given auth: Authenticator[IO] = successfulAuth(Sessions.sess)

        val req = Request[IO](Method.GET, uri"/accounts").withAuthHeader("foo")
        val res = AccountController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val responseBody = """{"message":"Missing authorization header"}"""
        res mustHaveStatus(Status.Forbidden, Some(responseBody))
        verifyNoInteractions(svc)
      }

      "return error on missing auth header" in {
        val svc = mock[AccountService[IO]]

        given auth: Authenticator[IO] = successfulAuth(Sessions.sess)

        val req = Request[IO](uri = uri"/accounts", method = Method.GET)
        val res = AccountController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus(Status.Forbidden, Some("""{"message":"Missing authorization header"}"""))
        verifyNoInteractions(svc)
      }
    }

    "POST /accounts" should {
      "create new cat and return 201 on success" in {
        val svc = mock[AccountService[IO]]
        when(svc.create(any[CreateAccount])).thenReturnIO(Accounts.acc(name = AccountName("new-account")))

        given auth: Authenticator[IO] = successfulAuth(Sessions.sess)

        val req = Request[IO](Method.POST, uri"/accounts")
          .withAuthHeader()
          .withBody(s"""{"name":"new-account","isMain":false,"currency":{"code":"GBP","symbol":"£"}}""")
        val res = AccountController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val resBody =
          s"""{
             |"id":"${Accounts.id}",
             |"name":"new-account",
             |"currency": {"code":"GBP","symbol":"£"},
             |"isMain":false
             |}""".stripMargin
        res mustHaveStatus(Status.Created, Some(resBody))
        verify(svc).create(Accounts.create())
      }

      "return 409 when cat name is taken" in {
        val svc = mock[AccountService[IO]]
        when(svc.create(any[CreateAccount])).thenRaiseError(AccountAlreadyExists(AccountName("new-account")))

        given auth: Authenticator[IO] = successfulAuth(Sessions.sess)

        val req = Request[IO](Method.POST, uri"/accounts")
          .withAuthHeader()
          .withBody(s"""{"name":"new-account","isMain":false,"currency":{"code":"GBP","symbol":"£"}}""")
        val res = AccountController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus(Status.Conflict, Some("""{"message":"An account with name new-account already exists"}"""))
        verify(svc).create(Accounts.create())
      }
    }

  }
