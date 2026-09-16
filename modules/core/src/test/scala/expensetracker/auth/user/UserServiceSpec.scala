package expensetracker.auth.user

import cats.effect.IO
import kirill5k.common.cats.test.IOWordSpec
import expensetracker.fixtures.Users
import expensetracker.auth.user.db.UserRepository
import expensetracker.common.actions.Action.SetupNewUser
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.common.errors.AppError.{InvalidEmailOrPassword, InvalidPassword}
import squants.market.GBP

import java.util.concurrent.CancellationException

class UserServiceSpec extends IOWordSpec {

  "A UserService" when {
    "deleteData" should {
      "dispatch an action for delete all user data" in {
        val (repo, encr, disp) = mocks
        when(disp.dispatchAndAwait(any[Action])).thenReturnUnit

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res     <- service.deleteData(Users.uid1)
        yield res

        result.asserting { res =>
          verify(disp).dispatchAndAwait(Action.DeleteAllUserData(Users.uid1))
          verifyNoMoreInteractions(disp)
          res mustBe ()
        }
      }
    }

    "delete" should {
      "keep the user available for retry when data cleanup fails" in {
        val (repo, encr, disp) = mocks
        val failure            = new RuntimeException("cleanup failed")
        when(disp.dispatchAndAwait(any[Action])).thenRaiseError(failure)

        val result = for
          service  <- UserService.make[IO](repo, encr, disp)
          response <- service.delete(Users.uid1).attempt
        yield response

        result.asserting { response =>
          verify(disp).dispatchAndAwait(Action.DeleteAllUserData(Users.uid1))
          verifyNoInteractions(repo, encr)
          response mustBe Left(failure)
        }
      }

      "delete user as well as dispatch an action for delete all user data" in {
        val (repo, encr, disp) = mocks
        when(repo.delete(any[UserId])).thenReturnUnit
        when(disp.dispatchAndAwait(any[Action])).thenReturnUnit

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res     <- service.delete(Users.uid1)
        yield res

        result.asserting { res =>
          verify(repo).delete(Users.uid1)
          verify(disp).dispatchAndAwait(Action.DeleteAllUserData(Users.uid1))
          verifyNoMoreInteractions(disp)
          res mustBe ()
        }
      }
    }

    "create" should {
      "remove partial setup and the user after a confirmed setup failure" in {
        val (repo, encr, disp) = mocks
        val failure            = new RuntimeException("setup failed")
        when(encr.hash(any[Password])).thenReturnIO(Users.hash)
        when(repo.create(any[UserDetails], any[PasswordHash])).thenReturnIO(Users.uid1)
        when(repo.delete(any[UserId])).thenReturnUnit
        when(disp.dispatchAndAwait(any[Action])).thenReturn(IO.raiseError(failure), IO.unit)

        val result = for
          service  <- UserService.make[IO](repo, encr, disp)
          response <- service.create(Users.details, Users.pwd).attempt
        yield response

        result.asserting { response =>
          verify(disp).dispatchAndAwait(SetupNewUser(Users.uid1, GBP))
          verify(disp).dispatchAndAwait(Action.DeleteAllUserData(Users.uid1))
          verify(repo).delete(Users.uid1)
          response mustBe Left(failure)
        }
      }

      "retain the user and return the original setup error when compensation cleanup fails" in {
        val (repo, encr, disp) = mocks
        val failure            = new RuntimeException("setup failed")
        when(encr.hash(any[Password])).thenReturnIO(Users.hash)
        when(repo.create(any[UserDetails], any[PasswordHash])).thenReturnIO(Users.uid1)
        when(disp.dispatchAndAwait(any[Action])).thenReturn(IO.raiseError(failure), IO.raiseError(new RuntimeException("cleanup failed")))

        val result = for
          service  <- UserService.make[IO](repo, encr, disp)
          response <- service.create(Users.details, Users.pwd).attempt
        yield response

        result.asserting { response =>
          verify(disp).dispatchAndAwait(Action.DeleteAllUserData(Users.uid1))
          verify(repo, never).delete(any[UserId])
          response mustBe Left(failure)
        }
      }

      "avoid queueing compensation when setup processing was interrupted" in {
        val (repo, encr, disp) = mocks
        val failure            = new CancellationException("processor stopped")
        when(encr.hash(any[Password])).thenReturnIO(Users.hash)
        when(repo.create(any[UserDetails], any[PasswordHash])).thenReturnIO(Users.uid1)
        when(disp.dispatchAndAwait(any[Action])).thenRaiseError(failure)

        val result = for
          service  <- UserService.make[IO](repo, encr, disp)
          response <- service.create(Users.details, Users.pwd).attempt
        yield response

        result.asserting { response =>
          verify(disp).dispatchAndAwait(SetupNewUser(Users.uid1, GBP))
          verifyNoMoreInteractions(disp)
          verify(repo, never).delete(any[UserId])
          response mustBe Left(failure)
        }
      }

      "return account id on success" in {
        val (repo, encr, disp) = mocks
        when(encr.hash(any[Password])).thenReturnIO(Users.hash)
        when(repo.create(any[UserDetails], any[PasswordHash])).thenReturnIO(Users.uid1)
        when(disp.dispatchAndAwait(any[Action])).thenReturnUnit

        val result = for
          service <- UserService.make[IO](repo, encr, disp)
          res     <- service.create(Users.details, Users.pwd)
        yield res

        result.asserting { res =>
          verify(encr).hash(Users.pwd)
          verify(repo).create(Users.details, Users.hash)
          verify(disp).dispatchAndAwait(SetupNewUser(Users.uid1, GBP))
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
