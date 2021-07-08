package expensetracker.auth.account

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.account.db.AccountRepository
import expensetracker.common.errors.AppError.InvalidEmailOrPassword

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
      "return unit when success" in {
        val (repo, encr) = mocks
        when(repo.updateSettings(any[AccountId], any[AccountSettings])).thenReturn(IO.unit)

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.updateSettings(aid, AccountSettings.Default)
        } yield res

        result.unsafeToFuture().map { res =>
          verify(repo).updateSettings(aid, AccountSettings.Default)
          res mustBe ()
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
