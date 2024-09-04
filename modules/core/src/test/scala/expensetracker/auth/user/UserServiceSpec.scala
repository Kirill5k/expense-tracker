package expensetracker.auth.user

import cats.effect.IO
import kirill5k.common.cats.test.IOWordSpec
import expensetracker.fixtures.Users
import expensetracker.auth.user.db.UserRepository
import expensetracker.common.actions.Action.SetupNewUser
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.common.errors.AppError.{InvalidEmailOrPassword, InvalidPassword}

class UserServiceSpec extends IOWordSpec {

  "A UserService" when {
    "create" should {
      "return account id on success" in {
        val (repo, encr, disp) = mocks
        when(encr.hash(any[Password])).thenReturnIO(Users.hash)
        when(repo.create(any[UserDetails], any[PasswordHash])).thenReturnIO(Users.uid1)
        when(disp.dispatch(any[Action])).thenReturnUnit

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res     <- service.create(Users.details, Users.pwd)
        yield res

        result.asserting { res =>
          verify(encr).hash(Users.pwd)
          verify(repo).create(Users.details, Users.hash)
          verify(disp).dispatch(SetupNewUser(Users.uid1))
          res mustBe Users.uid1
        }
      }
    }

    "updateSettings" should {
      "return unit on success" in {
        val (repo, encr, disp) = mocks
        when(repo.updateSettings(any[UserId], any[UserSettings])).thenReturnUnit

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res     <- service.updateSettings(Users.uid1, UserSettings.Default)
        yield res

        result.asserting { res =>
          verify(repo).updateSettings(Users.uid1, UserSettings.Default)
          verifyNoInteractions(encr, disp)
          res mustBe ()
        }
      }
    }

    "updatePassword" should {
      val cp = ChangePassword(Users.uid1, Users.pwd, Password("new-password"))

      "return unit on success" in {
        val (repo, encr, disp) = mocks
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturnIO(true)
        when(encr.hash(any[Password])).thenReturn(IO.pure(Users.hash))
        when(repo.find(any[UserId])).thenReturnIO(Users.user)
        when(repo.updatePassword(any[UserId])(any[PasswordHash])).thenReturnUnit

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res     <- service.changePassword(cp)
        yield res

        result.asserting { res =>
          verify(repo).find(cp.id)
          verify(encr).isValid(cp.currentPassword, Users.user.password)
          verify(encr).hash(cp.newPassword)
          verify(repo).updatePassword(cp.id)(Users.hash)
          verifyNoInteractions(disp)
          res mustBe ()
        }
      }

      "return error when passwords do not match" in {
        val (repo, encr, disp) = mocks
        when(repo.find(any[UserId])).thenReturnIO(Users.user)
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturnIO(false)

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res     <- service.changePassword(cp)
        yield res

        result.attempt.asserting { res =>
          verify(repo).find(cp.id)
          verify(encr).isValid(cp.currentPassword, Users.user.password)
          verifyNoMoreInteractions(repo, encr, disp)
          res mustBe Left(InvalidPassword)
        }
      }
    }

    "find" should {
      "return account on success" in {
        val (repo, encr, disp) = mocks
        when(repo.find(any[UserId])).thenReturnIO(Users.user)

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res     <- service.find(Users.uid1)
        yield res

        result.asserting { res =>
          verifyNoInteractions(encr, disp)
          verify(repo).find(Users.uid1)
          res mustBe Users.user
        }
      }
    }

    "findWithCategories" should {
      "return account on success" in {
        val (repo, encr, disp) = mocks
        when(repo.findWithCategories(any[UserId])).thenReturnIO(Users.user)

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res <- service.findWithCategories(Users.uid1)
        yield res

        result.asserting { res =>
          verifyNoInteractions(encr, disp)
          verify(repo).findWithCategories(Users.uid1)
          res mustBe Users.user
        }
      }
    }

    "login" should {

      "return account on success" in {
        val (repo, encr, disp) = mocks
        when(repo.findBy(any[UserEmail])).thenReturnSome(Users.user)
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturnIO(true)

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res     <- service.login(Login(Users.details.email, Users.pwd))
        yield res

        result.asserting { res =>
          verify(repo).findBy(Users.details.email)
          verify(encr).isValid(Users.pwd, Users.hash)
          verifyNoInteractions(disp)
          res mustBe Users.user
        }
      }

      "return error when account does not exist" in {
        val (repo, encr, disp) = mocks
        when(repo.findBy(any[UserEmail])).thenReturnNone

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res     <- service.login(Login(Users.details.email, Users.pwd))
        yield res

        result.attempt.asserting { res =>
          verify(repo).findBy(Users.details.email)
          verifyNoInteractions(encr, disp)
          res mustBe Left(InvalidEmailOrPassword)
        }
      }

      "return error when password doesn't match" in {
        val (repo, encr, disp) = mocks
        when(repo.findBy(any[UserEmail])).thenReturnSome(Users.user)
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturnIO(false)

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res     <- service.login(Login(Users.details.email, Users.pwd))
        yield res

        result.attempt.asserting { res =>
          verify(repo).findBy(Users.details.email)
          verify(encr).isValid(Users.pwd, Users.hash)
          verifyNoInteractions(disp)
          res mustBe Left(InvalidEmailOrPassword)
        }
      }
    }
  }

  def mocks: (UserRepository[IO], PasswordEncryptor[IO], ActionDispatcher[IO]) =
    (mock[UserRepository[IO]], mock[PasswordEncryptor[IO]], mock[ActionDispatcher[IO]])
}
