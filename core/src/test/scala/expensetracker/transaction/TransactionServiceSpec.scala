package expensetracker.transaction

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.fixtures.{Transactions, Users}
import expensetracker.auth.user.UserId
import expensetracker.transaction.db.TransactionRepository
import squants.market.GBP
import org.mockito.ArgumentMatchers.{any, anyBoolean}
import org.mockito.Mockito.{verify, when}

import java.time.LocalDate

class TransactionServiceSpec extends CatsSpec {

  "A TransactionService" should {
    "delete tx from db" in {
      val repo = mock[TransactionRepository[IO]]
      when(repo.delete(any[String].asInstanceOf[UserId], any[String].asInstanceOf[TransactionId])).thenReturn(IO.unit)

      val result = for {
        svc <- TransactionService.make[IO](repo)
        res <- svc.delete(Users.uid1, Transactions.txid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).delete(Users.uid1, Transactions.txid)
        res mustBe ()
      }
    }

    "update tx in db" in {
      val repo = mock[TransactionRepository[IO]]
      when(repo.update(any[Transaction])).thenReturn(IO.unit)

      val result = for {
        svc <- TransactionService.make[IO](repo)
        res <- svc.update(tx)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).update(tx)
        res mustBe ()
      }
    }

    "retrieve tx by id from db" in {
      val repo = mock[TransactionRepository[IO]]
      when(repo.get(any[String].asInstanceOf[UserId], any[String].asInstanceOf[TransactionId])).thenReturn(IO.pure(tx))

      val result = for {
        svc <- TransactionService.make[IO](repo)
        res <- svc.get(Users.uid1, Transactions.txid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).get(Users.uid1, Transactions.txid)
        res mustBe tx
      }
    }

    "retrieve all txs from db" in {
      val repo = mock[TransactionRepository[IO]]
      when(repo.getAll(any[String].asInstanceOf[UserId])).thenReturn(IO.pure(List(tx)))

      val result = for {
        svc <- TransactionService.make[IO](repo)
        res <- svc.getAll(Users.uid1)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).getAll(Users.uid1)
        res mustBe List(tx)
      }
    }

    "create new tx in db" in {
      val repo = mock[TransactionRepository[IO]]
      when(repo.create(any[CreateTransaction])).thenReturn(IO.pure(Transactions.txid))

      val create = Transactions.create()
      val result = for {
        svc <- TransactionService.make[IO](repo)
        res <- svc.create(create)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).create(create)
        res mustBe Transactions.txid
      }
    }

    "hide a tx in db" in {
      val repo = mock[TransactionRepository[IO]]
      when(repo.hide(any[String].asInstanceOf[UserId], any[String].asInstanceOf[TransactionId], anyBoolean)).thenReturn(IO.unit)

      val result = for {
        svc <- TransactionService.make[IO](repo)
        res <- svc.hide(Users.uid1, Transactions.txid, true)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).hide(Users.uid1, Transactions.txid, true)
        res mustBe ()
      }
    }
  }

}
