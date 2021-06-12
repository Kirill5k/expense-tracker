package expensetracker.auth.account

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.account.db.AccountRepository
import expensetracker.common.errors.AppError.InvalidEmailOrPassword

class AccountServiceSpec extends CatsSpec {

  val aid   = AccountId("a1")
  val pwd   = Password("pwd")
  val hash  = PasswordHash("hash")
  val email = AccountEmail("email")

  "An AccountService" when {
    "create" should {

      "return account id on success" in {
        val (repo, encr) = mocks
        when(encr.hash(any[Password])).thenReturn(IO.pure(hash))
        when(repo.create(any[AccountEmail], any[PasswordHash])).thenReturn(IO.pure(aid))

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.create(email, pwd)
        } yield res

        result.unsafeToFuture().map { res =>
          verify(encr).hash(pwd)
          verify(repo).create(email, hash)
          res mustBe aid
        }
      }
    }

    "login" should {

      "return account id on success" in {
        val (repo, encr) = mocks
        when(repo.find(any[AccountEmail])).thenReturn(IO.pure(Some(Account(aid, email, hash))))
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturn(IO.pure(true))

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.login(email, pwd)
        } yield res

        result.unsafeToFuture().map { res =>
          verify(repo).find(email)
          verify(encr).isValid(pwd, hash)
          res mustBe aid
        }
      }

      "return error when account does not exist" in {
        val (repo, encr) = mocks
        when(repo.find(any[AccountEmail])).thenReturn(IO.pure(None))

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.login(email, pwd)
        } yield res

        result.attempt.unsafeToFuture().map { res =>
          verify(repo).find(email)
          verifyZeroInteractions(encr)
          res mustBe Left(InvalidEmailOrPassword)
        }
      }

      "return error when password doesn't match" in {
        val (repo, encr) = mocks
        when(repo.find(any[AccountEmail])).thenReturn(IO.pure(Some(Account(aid, email, hash))))
        when(encr.isValid(any[Password], any[PasswordHash])).thenReturn(IO.pure(false))

        val result = for {
          service <- AccountService.make[IO](repo, encr)
          res     <- service.login(email, pwd)
        } yield res

        result.attempt.unsafeToFuture().map { res =>
          verify(repo).find(email)
          verify(encr).isValid(pwd, hash)
          res mustBe Left(InvalidEmailOrPassword)
        }
      }
    }
  }

  def mocks: (AccountRepository[IO], PasswordEncryptor[IO]) =
    (mock[AccountRepository[IO]], mock[PasswordEncryptor[IO]])
}
