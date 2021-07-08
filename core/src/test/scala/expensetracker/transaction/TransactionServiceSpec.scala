package expensetracker.transaction

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.account.AccountId
import expensetracker.transaction.db.TransactionRepository
import squants.market.GBP

import java.time.LocalDate

class TransactionServiceSpec extends CatsSpec {

  "A TransactionService" should {
    "delete tx from db" in {
      val repo = mock[TransactionRepository[IO]]
      when(repo.delete(any[AccountId], any[TransactionId])).thenReturn(IO.unit)

      val result = for {
        svc <- TransactionService.make[IO](repo)
        res <- svc.delete(aid, txid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).delete(aid, txid)
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
      when(repo.get(any[AccountId], any[TransactionId])).thenReturn(IO.pure(tx))

      val result = for {
        svc <- TransactionService.make[IO](repo)
        res <- svc.get(aid, txid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).get(aid, txid)
        res mustBe tx
      }
    }

    "retrieve all txs from db" in {
      val repo = mock[TransactionRepository[IO]]
      when(repo.getAll(any[AccountId])).thenReturn(IO.pure(List(tx)))

      val result = for {
        svc <- TransactionService.make[IO](repo)
        res <- svc.getAll(aid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).getAll(aid)
        res mustBe List(tx)
      }
    }

    "create new tx in db" in {
      val repo = mock[TransactionRepository[IO]]
      when(repo.create(any[CreateTransaction])).thenReturn(IO.pure(txid))

      val create = CreateTransaction(aid, TransactionKind.Income, cid, GBP(5.0), LocalDate.now(), None)
      val result = for {
        svc <- TransactionService.make[IO](repo)
        res <- svc.create(create)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).create(create)
        res mustBe txid
      }
    }
  }

}
