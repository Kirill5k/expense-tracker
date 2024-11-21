package expensetracker.transaction

import cats.effect.IO
import expensetracker.common.actions.ActionDispatcher
import expensetracker.transaction.db.PeriodicTransactionRepository
import expensetracker.fixtures.PeriodicTransactions
import kirill5k.common.cats.Clock
import kirill5k.common.cats.test.IOWordSpec

import java.time.{Instant, LocalDate}

class PeriodicTransactionServiceSpec extends IOWordSpec {
  val ts          = Instant.parse("2024-11-10T00:00:00Z")
  given Clock[IO] = Clock.mock(ts)

  "PeriodicTransactionService" when {
    "update" should {
      "save periodic tx with updated next date" in {
        val recurrence = PeriodicTransactions.recurrence.copy(
          startDate = LocalDate.of(2024, 1, 10),
          nextDate = Some(LocalDate.of(2025, 1, 10))
        )
        val ptx = PeriodicTransactions.tx(recurrence = recurrence)

        val (repo, disp) = mocks
        when(repo.update(any[PeriodicTransaction])).thenReturnUnit
        
        val result = for
          svc <- PeriodicTransactionService.make[IO](repo, disp)
          _ <- svc.update(ptx)
        yield ()

        result.asserting { res =>
          verifyNoInteractions(disp)
          verify(repo).update(ptx.copy(recurrence = recurrence.copy(nextDate = Some(LocalDate.of(2024, 12, 10)))))
          res mustBe ()
        }
      }

      "set next date to be equal to start date when it is in the future" in {
        val recurrence = PeriodicTransactions.recurrence.copy(
          startDate = LocalDate.of(2025, 1, 10),
          nextDate = Some(LocalDate.of(2026, 1, 10))
        )
        val ptx = PeriodicTransactions.tx(recurrence = recurrence)

        val (repo, disp) = mocks
        when(repo.update(any[PeriodicTransaction])).thenReturnUnit

        val result = for
          svc <- PeriodicTransactionService.make[IO](repo, disp)
          _ <- svc.update(ptx)
        yield ()

        result.asserting { res =>
          verifyNoInteractions(disp)
          verify(repo).update(ptx.copy(recurrence = recurrence.copy(nextDate = Some(LocalDate.of(2025, 1, 10)))))
          res mustBe()
        }
      }
    }
  }

  def mocks: (PeriodicTransactionRepository[IO], ActionDispatcher[IO]) =
    (mock[PeriodicTransactionRepository[IO]], mock[ActionDispatcher[IO]])
}
