package expensetracker.transaction

import eu.timepit.refined.numeric.Positive
import eu.timepit.refined.refineV
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

import java.time.LocalDate

class RecurrencePatternSpec extends AnyWordSpec with Matchers {
  
  "RecurrencePattern#dateSequence" when {
    "nextDate=None" should {
      "startDate < untilDate && endDate > untilDate" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 12, 31)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 3, 1))

        result mustBe List(
          LocalDate.of(2023, 3, 1),
          LocalDate.of(2023, 2, 1),
          LocalDate.of(2023, 1, 1)
        )
      }

      "startDate > untilDate && endDate > untilDate" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2024, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2024, 12, 31)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 3, 1))

        result mustBe Nil
      }

      "startDate < untilDate && endDate < untilDate" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 3, 1)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 4, 1))

        result mustBe List(
          LocalDate.of(2023, 2, 1),
          LocalDate.of(2023, 1, 1)
        )
      }

      "startDate < untilDate && endDate > untilDate && interval == 2" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 12, 31)),
          interval = refineV[Positive].unsafeFrom(2),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 3, 1))

        result mustBe List(
          LocalDate.of(2023, 3, 1),
          LocalDate.of(2023, 1, 1)
        )
      }

      "startDate < untilDate && endDate > untilDate && frequency == daily" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 12, 31)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Daily
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 1, 3))

        result mustBe List(
          LocalDate.of(2023, 1, 3), 
          LocalDate.of(2023, 1, 2), 
          LocalDate.of(2023, 1, 1)
        )
      }

      "startDate < untilDate && endDate > untilDate && frequency == weekly" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 12, 31)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Weekly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 2, 1))

        result mustBe List(
          LocalDate.of(2023, 1, 29),
          LocalDate.of(2023, 1, 22),
          LocalDate.of(2023, 1, 15),
          LocalDate.of(2023, 1, 8),
          LocalDate.of(2023, 1, 1),
        )
      }

      "startDate < untilDate && endDate > untilDate && frequency == weekly && interval == 2" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = None,
          endDate = Some(LocalDate.of(2023, 12, 31)),
          interval = refineV[Positive].unsafeFrom(2),
          frequency = RecurrenceFrequency.Weekly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 2, 1))

        result mustBe List(
          LocalDate.of(2023, 1, 29),
          LocalDate.of(2023, 1, 15),
          LocalDate.of(2023, 1, 1),
        )
      }
    }

    "nextDate < endDate && nextDate < untilDate && endDate == None" should {
      "startDate < untilDate" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = Some(LocalDate.of(2023, 2, 1)),
          endDate = None,
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 3, 1))

        result mustBe List(LocalDate.of(2023, 3, 1), LocalDate.of(2023, 2, 1))
      }

      "startDate < untilDate && endDate < untilDate" in {
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

    "nextDate > endDate && nextDate > untilDate" should {
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

    "nextDate == endDate && nextDate > untilDate" should {
      "return single date" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = Some(LocalDate.of(2023, 4, 1)),
          endDate = Some(LocalDate.of(2024, 1, 1)),
          interval = refineV[Positive].unsafeFrom(1),
          frequency = RecurrenceFrequency.Monthly
        )

        val result = pattern.dateSequence(LocalDate.of(2023, 4, 1))

        result mustBe List(LocalDate.of(2023, 4, 1))
      }
    }

    "nextDate < endDate && nextDate > untilDate" should {
      "not return anything" in {
        val pattern = RecurrencePattern(
          startDate = LocalDate.of(2023, 1, 1),
          nextDate = Some(LocalDate.of(2023, 5, 1)),
          endDate = Some(LocalDate.of(2024, 1, 1)),
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

    "handle scenarios when start date is in future" in {
      val pattern = RecurrencePattern(
        startDate = LocalDate.of(2024, 1, 1),
        nextDate = None,
        endDate = Some(LocalDate.of(2024, 12, 31)),
        interval = refineV[Positive].unsafeFrom(1),
        frequency = RecurrenceFrequency.Monthly
      )

      val result = pattern.withUpdatedNextDate(LocalDate.of(2023, 3, 1))

      result mustBe RecurrencePattern(
        startDate = LocalDate.of(2024, 1, 1),
        nextDate = Some(LocalDate.of(2024, 1, 1)),
        endDate = Some(LocalDate.of(2024, 12, 31)),
        interval = refineV[Positive].unsafeFrom(1),
        frequency = RecurrenceFrequency.Monthly
      )
    }
  }
}
