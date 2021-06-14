package expensetracker.auth

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.account.AccountService
import expensetracker.auth.session.{SessionId, SessionService}

class AuthServiceSpec extends CatsSpec {

  "An AuthService" should {

    "delete session on logout" in {
      val (accSvc, sessSvc) = mocks
      when(sessSvc.delete(any[SessionId])).thenReturn(IO.unit)

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res <- authSvc.logout(sid)
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
