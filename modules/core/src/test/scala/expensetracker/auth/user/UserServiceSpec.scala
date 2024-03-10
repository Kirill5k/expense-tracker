package expensetracker.auth.user

import cats.effect.IO
import kirill5k.common.cats.test.IOWordSpec
import expensetracker.fixtures.Users
import expensetracker.auth.user.db.UserRepository
import expensetracker.common.errors.AppError.{InvalidEmailOrPassword, InvalidPassword}

class UserServiceSpec extends IOWordSpec {

  "A UserService" when {
    "create" should {
      "return account id on success" in {
        val (repo, encr) = mocks
        when(encr.hash(any[Password])).thenReturn(IO.pure(Users.hash))
        when(repo.create(any[UserDetails], any[PasswordHash])).thenReturn(IO.pure(Users.uid1))

        val result = for
          service <- UserService.make[IO](repo, encr)
          res     <- service.create(Users.details, Users.pwd)
        yield res

        result.asserting { res =>
          verify(encr).hash(Users.pwd)
          verify(repo).create(Users.details, Users.hash)
          res mustBe Users.uid1
        }
      }
    }

    "updateSettings" should {
      "return unit on success" in {
        val (repo, encr) = mocks
        when(repo.updateSettings(any[UserId], any[UserSettings])).thenReturn(IO.unit)

        val result = for
          service <- UserService.make[IO](repo, encr)
          res     <- service.updateSettings(Users.uid1, UserSettings.Default)
        yield res

        result.asserting { res =>
          verify(repo).updateSettings(Users.uid1, UserSettings.Default)
          verifyNoInteractions(encr)
          res mustBe ()
        }
      }
    }

    "updatePassword" should {
      val cp = ChangePassword(Users.uid1, Users.pwd, Password("new-password"))

      "return unit on success" in {
        val (repo, encr) = mocks
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturn(IO.pure(true))
        when(encr.hash(any[Password])).thenReturn(IO.pure(Users.hash))
        when(repo.find(any[UserId])).thenReturn(IO.pure(Users.user))
        when(repo.updatePassword(any[UserId])(any[PasswordHash])).thenReturn(IO.unit)

        val result = for
          service <- UserService.make[IO](repo, encr)
          res     <- service.changePassword(cp)
        yield res

        result.asserting { res =>
          verify(repo).find(cp.id)
          verify(encr).isValid(cp.currentPassword, Users.user.password)
          verify(encr).hash(cp.newPassword)
          verify(repo).updatePassword(cp.id)(Users.hash)
          res mustBe ()
        }
      }

      "return error when passwords do not match" in {
        val (repo, encr) = mocks
        when(repo.find(any[UserId])).thenReturn(IO.pure(Users.user))
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturn(IO.pure(false))

        val result = for
          service <- UserService.make[IO](repo, encr)
          res     <- service.changePassword(cp)
        yield res

        result.attempt.asserting { res =>
          verify(repo).find(cp.id)
          verify(encr).isValid(cp.currentPassword, Users.user.password)
          verifyNoMoreInteractions(repo, encr)
          res mustBe Left(InvalidPassword)
        }
      }
    }

    "find" should {
      "return account on success" in {
        val (repo, encr) = mocks
        when(repo.find(any[UserId])).thenReturn(IO.pure(Users.user))

        val result = for
          service <- UserService.make[IO](repo, encr)
          res     <- service.find(Users.uid1)
        yield res

        result.asserting { res =>
          verifyNoInteractions(encr)
          verify(repo).find(Users.uid1)
          res mustBe Users.user
        }
      }
    }

    "login" should {

      "return account on success" in {
        val (repo, encr) = mocks
        when(repo.findBy(any[UserEmail])).thenReturn(IO.pure(Some(Users.user)))
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturn(IO.pure(true))

        val result = for
          service <- UserService.make[IO](repo, encr)
          res     <- service.login(Login(Users.details.email, Users.pwd))
        yield res

        result.asserting { res =>
          verify(repo).findBy(Users.details.email)
          verify(encr).isValid(Users.pwd, Users.hash)
          res mustBe Users.user
        }
      }

      "return error when account does not exist" in {
        val (repo, encr) = mocks
        when(repo.findBy(any[UserEmail])).thenReturn(IO.pure(None))

        val result = for
          service <- UserService.make[IO](repo, encr)
          res     <- service.login(Login(Users.details.email, Users.pwd))
        yield res

        result.attempt.asserting { res =>
          verify(repo).findBy(Users.details.email)
          verifyNoInteractions(encr)
          res mustBe Left(InvalidEmailOrPassword)
        }
      }

      "return error when password doesn't match" in {
        val (repo, encr) = mocks
        when(repo.findBy(any[UserEmail])).thenReturn(IO.pure(Some(Users.user)))
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturn(IO.pure(false))

        val result = for
          service <- UserService.make[IO](repo, encr)
          res     <- service.login(Login(Users.details.email, Users.pwd))
        yield res

        result.attempt.asserting { res =>
          verify(repo).findBy(Users.details.email)
          verify(encr).isValid(Users.pwd, Users.hash)
          res mustBe Left(InvalidEmailOrPassword)
        }
      }
    }
  }

  def mocks: (UserRepository[IO], PasswordEncryptor[IO]) =
    (mock[UserRepository[IO]], mock[PasswordEncryptor[IO]])
}
