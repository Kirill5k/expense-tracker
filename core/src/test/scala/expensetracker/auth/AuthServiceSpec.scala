package expensetracker.auth

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.account.{AccountDetails, AccountEmail, AccountId, AccountService, Password}
import expensetracker.auth.session.{SessionId, SessionService}

import scala.concurrent.duration._

class AuthServiceSpec extends CatsSpec {

  "An AuthService" should {

    "create new accounts" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.create(any[AccountDetails], any[Password])).thenReturn(IO.pure(aid))

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.createAccount(details, pwd)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(accSvc).create(details, pwd)
        verifyZeroInteractions(sessSvc)
        res mustBe aid
      }
    }

    "find session by session id" in {
      val (accSvc, sessSvc) = mocks
      when(sessSvc.find(any[SessionId])).thenReturn(IO.pure(Some(sess)))

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.findSession(sid)
      } yield res

      result.unsafeToFuture().map { res =>
        verifyZeroInteractions(accSvc)
        verify(sessSvc).find(sid)
        res mustBe Some(sess)
      }
    }

    "create new session on login" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.login(any[AccountEmail], any[Password])).thenReturn(IO.pure(aid))
      when(sessSvc.create(any[AccountId], any[FiniteDuration])).thenReturn(IO.pure(sid))

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.login(email, pwd, 90.days)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(accSvc).login(email, pwd)
        verify(sessSvc).create(aid, 90.days)
        res mustBe sid
      }
    }

    "delete session on logout" in {
      val (accSvc, sessSvc) = mocks
      when(sessSvc.delete(any[SessionId])).thenReturn(IO.unit)

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.logout(sid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(sessSvc).delete(sid)
        verifyZeroInteractions(accSvc)
        res mustBe ()
      }
    }
  }

  def mocks: (AccountService[IO], SessionService[IO]) =
    (mock[AccountService[IO]], mock[SessionService[IO]])
}
