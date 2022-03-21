package expensetracker.auth

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.jwt.BearerToken
import expensetracker.fixtures.{Sessions, Users}
import expensetracker.auth.user.*
import expensetracker.auth.session.{CreateSession, SessionId, SessionService}
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.{verify, verifyNoInteractions, when}

class AuthServiceSpec extends CatsSpec {

  "An AuthService" should {

    "create new accounts" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.create(any[UserDetails], any[Password])).thenReturn(IO.pure(Users.uid1))

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.createUser(Users.details, Users.pwd)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(accSvc).create(Users.details, Users.pwd)
        verifyNoInteractions(sessSvc)
        res mustBe Users.uid1
      }
    }

    "find account by account id" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.find(any[UserId])).thenReturn(IO.pure(Users.user))

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.findUser(Users.uid1)
      } yield res

      result.unsafeToFuture().map { res =>
        verifyNoInteractions(sessSvc)
        verify(accSvc).find(Users.uid1)
        res mustBe Users.user
      }
    }

    "return account on login" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.login(any[Login])).thenReturn(IO.pure(Users.user))

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.login(Login(Users.email, Users.pwd))
      } yield res

      result.unsafeToFuture().map { res =>
        verify(accSvc).login(Login(Users.email, Users.pwd))
        verifyNoInteractions(sessSvc)
        res mustBe Users.user
      }
    }

    "create new session" in {
      val (accSvc, sessSvc) = mocks
      when(sessSvc.create(any[CreateSession])).thenReturn(IO.pure(BearerToken("token")))

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.createSession(Sessions.create())
      } yield res

      result.unsafeToFuture().map { res =>
        verify(sessSvc).create(Sessions.create())
        verifyNoInteractions(accSvc)
        res mustBe BearerToken("token")
      }
    }
    
    "delete session on logout" in {
      val (accSvc, sessSvc) = mocks
      when(sessSvc.unauth(any[SessionId])).thenReturn(IO.unit)

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.logout(Sessions.sid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(sessSvc).unauth(Sessions.sid)
        verifyNoInteractions(accSvc)
        res mustBe ()
      }
    }

    "update settings" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.updateSettings(any[UserId], any[UserSettings])).thenReturn(IO.unit)

      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.updateSettings(Users.uid1, UserSettings.Default)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(accSvc).updateSettings(Users.uid1, UserSettings.Default)
        verifyNoInteractions(sessSvc)
        res mustBe ()
      }
    }

    "change password" in {
      val (accSvc, sessSvc) = mocks
      when(accSvc.changePassword(any[ChangePassword])).thenReturn(IO.unit)
      when(sessSvc.invalidateAll(any[UserId])).thenReturn(IO.unit)

      val cp = ChangePassword(Users.uid1, Users.pwd, Users.pwd)
      val result = for {
        authSvc <- AuthService.make[IO](accSvc, sessSvc)
        res     <- authSvc.changePassword(cp)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(accSvc).changePassword(cp)
        verify(sessSvc).invalidateAll(Users.uid1)
        res mustBe ()
      }
    }
  }

  def mocks: (UserService[IO], SessionService[IO]) =
    (mock[UserService[IO]], mock[SessionService[IO]])
}
