package expensetracker.auth.account

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.account.db.AccountRepository
import expensetracker.common.errors.AppError.{InvalidEmailOrPassword, InvalidPassword}

class AccountServiceSpec extends CatsSpec {

  "An AccountService" when {
    "create" should {
      "return account id on success" in {
        val (repo, encr) = mocks
        when(encr.hash(any[Password])).thenReturn(IO.pure(hash))
        when(repo.create(any[AccountDetails], any[PasswordHash])).thenReturn(IO.pure(aid))

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.create(details, pwd)
        } yield res

        result.unsafeToFuture().map { res =>
          verify(encr).hash(pwd)
          verify(repo).create(details, hash)
          res mustBe aid
        }
      }
    }

    "updateSettings" should {
      "return unit on success" in {
        val (repo, encr) = mocks
        when(repo.updateSettings(any[AccountId], any[AccountSettings])).thenReturn(IO.unit)

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.updateSettings(aid, AccountSettings.Default)
        } yield res

        result.unsafeToFuture().map { res =>
          verify(repo).updateSettings(aid, AccountSettings.Default)
          verifyZeroInteractions(encr)
          res mustBe ()
        }
      }
    }

    "updatePassword" should {
      val cp = ChangePassword(aid, pwd, Password("new-password"))

      "return unit on success" in {
        val (repo, encr) = mocks
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturn(IO.pure(true))
        when(encr.hash(any[Password])).thenReturn(IO.pure(hash))
        when(repo.find(any[AccountId])).thenReturn(IO.pure(acc))
        when(repo.updatePassword(any[AccountId])(any[PasswordHash])).thenReturn(IO.unit)

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.changePassword(cp)
        } yield res

        result.unsafeToFuture().map { res =>
          verify(repo).find(cp.id)
          verify(encr).isValid(cp.currentPassword, acc.password)
          verify(encr).hash(cp.newPassword)
          verify(repo).updatePassword(cp.id)(hash)
          res mustBe ()
        }
      }

      "return error when passwords do not match" in {
        val (repo, encr) = mocks
        when(repo.find(any[AccountId])).thenReturn(IO.pure(acc))
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturn(IO.pure(false))

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.changePassword(cp)
        } yield res

        result.attempt.unsafeToFuture().map { res =>
          verify(repo).find(cp.id)
          verify(encr).isValid(cp.currentPassword, acc.password)
          verifyNoMoreInteractions(repo, encr)
          res mustBe Left(InvalidPassword)
        }
      }
    }

    "find" should {
      "return account on success" in {
        val (repo, encr) = mocks
        when(repo.find(any[AccountId])).thenReturn(IO.pure(acc))

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.find(aid)
        } yield res

        result.unsafeToFuture().map { res =>
          verifyZeroInteractions(encr)
          verify(repo).find(aid)
          res mustBe acc
        }
      }
    }

    "login" should {

      "return account on success" in {
        val (repo, encr) = mocks
        when(repo.findBy(any[AccountEmail])).thenReturn(IO.pure(Some(acc)))
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturn(IO.pure(true))

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.login(details.email, pwd)
        } yield res

        result.unsafeToFuture().map { res =>
          verify(repo).findBy(details.email)
          verify(encr).isValid(pwd, hash)
          res mustBe acc
        }
      }

      "return error when account does not exist" in {
        val (repo, encr) = mocks
        when(repo.findBy(any[AccountEmail])).thenReturn(IO.pure(None))

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.login(details.email, pwd)
        } yield res

        result.attempt.unsafeToFuture().map { res =>
          verify(repo).findBy(details.email)
          verifyZeroInteractions(encr)
          res mustBe Left(InvalidEmailOrPassword)
        }
      }

      "return error when password doesn't match" in {
        val (repo, encr) = mocks
        when(repo.findBy(any[AccountEmail])).thenReturn(IO.pure(Some(acc)))
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturn(IO.pure(false))

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.login(details.email, pwd)
        } yield res

        result.attempt.unsafeToFuture().map { res =>
          verify(repo).findBy(details.email)
          verify(encr).isValid(pwd, hash)
          res mustBe Left(InvalidEmailOrPassword)
        }
      }
    }
  }

  def mocks: (AccountRepository[IO], PasswordEncryptor[IO]) =
    (mock[AccountRepository[IO]], mock[PasswordEncryptor[IO]])
}
