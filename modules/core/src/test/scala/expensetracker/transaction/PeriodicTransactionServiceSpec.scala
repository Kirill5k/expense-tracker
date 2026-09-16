package expensetracker.transaction

import cats.effect.IO
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.transaction.db.PeriodicTransactionRepository
import expensetracker.fixtures.PeriodicTransactions
import kirill5k.common.cats.Clock
import kirill5k.common.cats.test.IOWordSpec
import kirill5k.common.syntax.time.*

import java.time.LocalDate

class PeriodicTransactionServiceSpec extends IOWordSpec {
  val now         = LocalDate.of(2024, 11, 10)
  given Clock[IO] = Clock.mock(now.toInstantAtStartOfDay)

  "PeriodicTransactionService" when {
    "generateRecurrencesForToday" should {
      "generate periodic transaction recurrences" in {
        val txid       = TransactionId("673cb70801452339cd5b4ec1")
        val recurrence = PeriodicTransactions.recurrence.copy(
          startDate = LocalDate.of(2024, 1, 10),
          nextDate = Some(now)
        )
        val ptx = PeriodicTransactions.tx(id = txid, recurrence = recurrence)

        val (repo, disp) = mocks
        when(repo.getAllByRecurrenceDate(any[LocalDate])).thenReturnIO(List(ptx))
        when(disp.dispatch(any[Action])).thenReturnUnit

        val result = for
          svc <- PeriodicTransactionService.make[IO](repo, disp)
          _   <- svc.generateRecurrencesForToday
        yield ()

        result.asserting { res =>
          verify(repo).getAllByRecurrenceDate(now)
          verify(disp).dispatch(
            Action.SaveGeneratedRecurrences(
              List(
                Transaction(
                  id = TransactionId("672ff78060d80ea32bb028cb"),
                  userId = ptx.userId,
                  categoryId = ptx.categoryId,
                  accountId = ptx.accountId,
                  parentTransactionId = Some(ptx.id),
                  isRecurring = true,
                  amount = ptx.amount,
                  date = now,
                  note = ptx.note,
                  tags = ptx.tags,
                  hidden = false
                )
              ),
              List(checkpoint(ptx, now))
            )
          )
          verifyNoMoreInteractions(disp, repo)
          res mustBe ()
        }
      }

      "catch up missed occurrences before an exclusive end date after downtime" in {
        val recurrence = PeriodicTransactions.recurrence.copy(
          startDate = now.minusDays(10),
          nextDate = Some(now.minusDays(4)),
          endDate = Some(now.minusDays(1)),
          frequency = RecurrenceFrequency.Daily
        )
        val ptx   = PeriodicTransactions.tx(recurrence = recurrence)
        val dates = List(now.minusDays(4), now.minusDays(3), now.minusDays(2))

        val (repo, disp) = mocks
        when(repo.getAllByRecurrenceDate(any[LocalDate])).thenReturnIO(List(ptx))
        when(disp.dispatch(any[Action])).thenReturnUnit

        val result = for
          svc <- PeriodicTransactionService.make[IO](repo, disp)
          _   <- svc.generateRecurrencesForToday
        yield ()

        result.asserting { _ =>
          verify(repo).getAllByRecurrenceDate(now)
          verify(disp).dispatch(Action.SaveGeneratedRecurrences(dates.map(ptx.toTransaction), List(checkpoint(ptx, dates.last))))
          verifyNoMoreInteractions(repo, disp)
          succeed
        }
      }

      "do nothing when there are no due schedules" in {
        val (repo, disp) = mocks
        when(repo.getAllByRecurrenceDate(any[LocalDate])).thenReturnIO(Nil)

        val result = for
          svc <- PeriodicTransactionService.make[IO](repo, disp)
          _   <- svc.generateRecurrencesForToday
        yield ()

        result.asserting { _ =>
          verify(repo).getAllByRecurrenceDate(now)
          verifyNoMoreInteractions(repo)
          verifyNoInteractions(disp)
          succeed
        }
      }
    }

    "create" should {
      "dispatch generated instances and their checkpoint together" in {
        val recurrence   = PeriodicTransactions.recurrence.copy(startDate = now, nextDate = None)
        val create       = PeriodicTransactions.create(recurrence = recurrence)
        val ptx          = PeriodicTransactions.tx(recurrence = recurrence)
        val (repo, disp) = mocks
        when(repo.create(any[CreatePeriodicTransaction])).thenReturnIO(ptx)
        when(disp.dispatch(any[Action])).thenReturnUnit

        val result = for
          svc <- PeriodicTransactionService.make[IO](repo, disp)
          tx  <- svc.create(create)
        yield tx

        result.asserting { tx =>
          tx mustBe ptx.withUpdatedNextDate(now)
          verify(repo).create(create)
          verify(disp).dispatch(Action.SaveGeneratedRecurrences(List(ptx.toTransaction(now)), List(checkpoint(ptx, now))))
          verifyNoMoreInteractions(repo, disp)
          succeed
        }
      }

      "save the initial next date directly for a future schedule with no instances" in {
        val recurrence   = PeriodicTransactions.recurrence.copy(startDate = now.plusDays(1), nextDate = None)
        val create       = PeriodicTransactions.create(recurrence = recurrence)
        val ptx          = PeriodicTransactions.tx(recurrence = recurrence)
        val (repo, disp) = mocks
        when(repo.create(any[CreatePeriodicTransaction])).thenReturnIO(ptx)
        when(repo.save(anyList[PeriodicTransaction])).thenReturnUnit

        val result = for
          svc <- PeriodicTransactionService.make[IO](repo, disp)
          tx  <- svc.create(create)
        yield tx

        result.asserting { tx =>
          tx.recurrence.nextDate mustBe Some(recurrence.startDate)
          verify(repo).create(create)
          verify(repo).save(List(tx))
          verifyNoMoreInteractions(repo)
          verifyNoInteractions(disp)
          succeed
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

  private def checkpoint(tx: PeriodicTransaction, date: LocalDate): RecurrenceCheckpoint =
    RecurrenceCheckpoint(tx.id, tx.userId, tx.recurrence, tx.withUpdatedNextDate(date).recurrence.nextDate)

  def mocks: (PeriodicTransactionRepository[IO], ActionDispatcher[IO]) =
    (mock[PeriodicTransactionRepository[IO]], mock[ActionDispatcher[IO]])
}
