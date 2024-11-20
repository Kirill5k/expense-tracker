package expensetracker.transaction

import eu.timepit.refined.numeric.Positive
import eu.timepit.refined.refineV
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

import java.time.LocalDate

class RecurrencePatternSpec extends AnyWordSpec with Matchers {
  
  "RecurrencePattern#dateSequence" when {
    "nextDate is not defined" should {
      "generate list of monthly date sequences starting from startDate up until provided date" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 12, 31)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 3, 1))

        result mustBe List(LocalDate.of(2023, 1, 1), LocalDate.of(2023, 2, 1), LocalDate.of(2023, 3, 1))
      }

      "generate list of monthly date sequences starting from startDate up until end date when provided date is after" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 3, 1)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 4, 1))

        result mustBe List(LocalDate.of(2023, 1, 1), LocalDate.of(2023, 2, 1))
      }

      "generate list of monthly date sequences with interval starting from startDate up until provided date" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 12, 31)),
          interval = refineV[Positive].unsafeFrom(2),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 3, 1))

        result mustBe List(LocalDate.of(2023, 1, 1), LocalDate.of(2023, 3, 1))
      }

      "generate list of daily date sequences from startDate up until provided date" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 12, 31)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Daily
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 1, 3))

        result mustBe List(LocalDate.of(2023, 1, 1), LocalDate.of(2023, 1, 2), LocalDate.of(2023, 1, 3))
      }

      "generate list of weekly date sequences from startDate up until provided date" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 12, 31)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Weekly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 2, 1))

        result mustBe List(
          LocalDate.of(2023, 1, 1),
          LocalDate.of(2023, 1, 8),
          LocalDate.of(2023, 1, 15),
          LocalDate.of(2023, 1, 22),
          LocalDate.of(2023, 1, 29),
        )
      }

      "generate list of bi-weekly date sequences from startDate up until provided date" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 12, 31)),
          interval = refineV[Positive].unsafeFrom(2),
          frequency = RecurrenceFrequency.Weekly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 2, 1))

        result mustBe List(
          LocalDate.of(2023, 1, 1),
          LocalDate.of(2023, 1, 15),
          LocalDate.of(2023, 1, 29),
        )
      }
    }

    "nextDate is before endDate and provided date" should {
      "generate list of monthly date sequences starting from nextDate up until provided date" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = Some(LocalDate.of(2023, 2, 1)),
          endDate = None,
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 3, 1))

        result mustBe List(LocalDate.of(2023, 2, 1), LocalDate.of(2023, 3, 1))
      }

      "generate list of monthly date sequences starting from nextDate up until end date given that provided date is after" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = Some(LocalDate.of(2023, 2, 1)),
          endDate = Some(LocalDate.of(2023, 3, 1)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 4, 1))

        result mustBe List(LocalDate.of(2023, 2, 1))
      }
    }

    "nextDate is after endDate and provided date" should {
      "not return anything" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = Some(LocalDate.of(2023, 2, 1)),
          endDate = Some(LocalDate.of(2023, 1, 30)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 4, 1))

        result mustBe Nil
      }
    }
  }

  "RecurrencePattern#withUpdatedNextDate" should {
    "return a copy itself with nextDate generated" in {
      val pattern = RecurrencePattern(
        startDate = LocalDate.of(2023, 1, 1),
        nextDate = None,
        endDate = Some(LocalDate.of(2023, 12, 31)),
        interval = refineV[Positive].unsafeFrom(1),
        frequency = RecurrenceFrequency.Monthly
      )

      val result = pattern.withUpdatedNextDate(LocalDate.of(2023, 3, 1))

      result mustBe RecurrencePattern(
        startDate = LocalDate.of(2023, 1, 1),
        nextDate = Some(LocalDate.of(2023, 4, 1)),
        endDate = Some(LocalDate.of(2023, 12, 31)),
        interval = refineV[Positive].unsafeFrom(1),
        frequency = RecurrenceFrequency.Monthly
      )
    }
  }
}
