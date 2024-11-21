package expensetracker.transaction

import cats.effect.IO
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.transaction.db.PeriodicTransactionRepository
import expensetracker.fixtures.PeriodicTransactions
import kirill5k.common.cats.Clock
import kirill5k.common.cats.test.IOWordSpec
import kirill5k.common.syntax.time.*

import java.time.{Instant, LocalDate}

class PeriodicTransactionServiceSpec extends IOWordSpec {
  val now         = LocalDate.of(2024, 11, 10)
  given Clock[IO] = Clock.mock(now.toInstantAtStartOfDay)

  "PeriodicTransactionService" when {
    "generateRecurrencesForToday" should {
      "generate periodic transaction recurrences" in {
        val txid = TransactionId("673cb70801452339cd5b4ec1")
        val recurrence = PeriodicTransactions.recurrence.copy(
          startDate = LocalDate.of(2024, 1, 10),
          nextDate = Some(now)
        )
        val ptx = PeriodicTransactions.tx(id = txid, recurrence = recurrence)

        val (repo, disp) = mocks
        when(repo.getAllByRecurrenceDate(any[LocalDate])).thenReturnIO(List(ptx))
        when(repo.save(anyList[PeriodicTransaction])).thenReturnUnit
        when(disp.dispatch(any[Action])).thenReturnUnit

        val result = for
          svc <- PeriodicTransactionService.make[IO](repo, disp)
          _   <- svc.generateRecurrencesForToday
        yield ()

        result.asserting { res =>
          verify(repo).getAllByRecurrenceDate(now)
          verify(disp).dispatch(
            Action.SaveTransactions(
              List(
                Transaction(
                  id = TransactionId("672ff78060d80ea32bb028cb"),
                  userId = ptx.userId,
                  categoryId = ptx.categoryId,
                  parentTransactionId = Some(ptx.id),
                  isRecurring = true,
                  amount = ptx.amount,
                  date = now,
                  note = ptx.note,
                  tags = ptx.tags,
                  hidden = false
                )
              )
            )
          )
          verify(repo).save(List(ptx.withUpdatedNextDate(now)))
          verify(disp).dispatch(Action.SchedulePeriodicTransactionRecurrenceGeneration)
          verifyNoMoreInteractions(disp, repo)
          res mustBe ()
        }
      }
    }

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
          _   <- svc.update(ptx)
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
          _   <- svc.update(ptx)
        yield ()

        result.asserting { res =>
          verifyNoInteractions(disp)
          verify(repo).update(ptx.copy(recurrence = recurrence.copy(nextDate = Some(LocalDate.of(2025, 1, 10)))))
          res mustBe ()
        }
      }
    }
  }

  def mocks: (PeriodicTransactionRepository[IO], ActionDispatcher[IO]) =
    (mock[PeriodicTransactionRepository[IO]], mock[ActionDispatcher[IO]])
}
