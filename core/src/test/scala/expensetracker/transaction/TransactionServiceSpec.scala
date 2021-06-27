package expensetracker.transaction

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.account.AccountId
import expensetracker.transaction.db.TransactionRepository
import squants.market.GBP

import java.time.Instant

class TransactionServiceSpec extends CatsSpec {

  "A TransactionService" should {
    "delete tx from db" in {
      pending
    }

    "update tx in db" in {
      pending
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

      val create = CreateTransaction(aid, TransactionKind.Income, cid, GBP(5.0), Instant.now(), None)
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
