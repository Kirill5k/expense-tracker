package expensetracker.auth

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.user.{UserDetails, UserEmail, UserId, UserService, UserSettings, ChangePassword, Password}
import expensetracker.auth.session.{SessionActivity, SessionId, SessionService}

class AuthServiceSpec extends CatsSpec {

  "An AuthService" should {

    "create new accounts" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.create(any[UserDetails], any[Password])).thenReturn(IO.pure(uid))

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.createUser(details, pwd)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(accSvc).create(details, pwd)
        verifyZeroInteractions(sessSvc)
        res mustBe uid
      }
    }

    "find session by session id" in {
      val (accSvc, sessSvc) = mocks
      when(sessSvc.find(any[SessionId], any[Option[SessionActivity]])).thenReturn(IO.pure(Some(sess)))

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.findSession(sid, sa)
      } yield res

      result.unsafeToFuture().map { res =>
        verifyZeroInteractions(accSvc)
        verify(sessSvc).find(sid, sa)
        res mustBe Some(sess)
      }
    }

    "find account by account id" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.find(any[UserId])).thenReturn(IO.pure(user))

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.findUser(uid)
      } yield res

      result.unsafeToFuture().map { res =>
        verifyZeroInteractions(sessSvc)
        verify(accSvc).find(uid)
        res mustBe user
      }
    }

    "return account on login" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.login(any[UserEmail], any[Password])).thenReturn(IO.pure(user))

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.login(email, pwd)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(accSvc).login(email, pwd)
        verifyZeroInteractions(sessSvc)
        res mustBe user
      }
    }

    "delete session on logout" in {
      val (accSvc, sessSvc) = mocks
      when(sessSvc.unauth(any[SessionId])).thenReturn(IO.unit)

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.logout(sid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(sessSvc).unauth(sid)
        verifyZeroInteractions(accSvc)
        res mustBe ()
      }
    }

    "update settings" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.updateSettings(any[UserId], any[UserSettings])).thenReturn(IO.unit)

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.updateSettings(uid, UserSettings.Default)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(accSvc).updateSettings(uid, UserSettings.Default)
        verifyZeroInteractions(sessSvc)
        res mustBe ()
      }
    }

    "change password" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.changePassword(any[ChangePassword])).thenReturn(IO.unit)
      when(sessSvc.invalidateAll(any[UserId])).thenReturn(IO.unit)

      val cp = ChangePassword(uid, pwd, pwd)
      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.changePassword(cp)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(accSvc).changePassword(cp)
        verify(sessSvc).invalidateAll(uid)
        res mustBe ()
      }
    }
  }

  def mocks: (UserService[IO], SessionService[IO]) =
    (mock[UserService[IO]], mock[SessionService[IO]])
}
