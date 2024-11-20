package expensetracker.transaction

import eu.timepit.refined.types.numeric.PosInt
import expensetracker.auth.user.UserId
import expensetracker.category.{Category, CategoryId}
import expensetracker.common.types.{EnumType, IdType}
import io.circe.Codec
import io.circe.refined.*
import squants.market.Money

import java.time.{Instant, LocalDate}

opaque type TransactionId = String
object TransactionId extends IdType[TransactionId]

final case class Transaction(
    id: TransactionId,
    userId: UserId,
    categoryId: CategoryId,
    parentTransactionId: Option[TransactionId],
    isRecurring: Boolean,
    amount: Money,
    date: LocalDate,
    note: Option[String],
    tags: Set[String],
    hidden: Boolean,
    category: Option[Category] = None,
    createdAt: Option[Instant] = None,
    lastUpdatedAt: Option[Instant] = None
)

final case class CreateTransaction(
    userId: UserId,
    categoryId: CategoryId,
    amount: Money,
    date: LocalDate,
    note: Option[String],
    tags: Set[String]
)

final case class PeriodicTransaction(
    id: TransactionId,
    userId: UserId,
    categoryId: CategoryId,
    amount: Money,
    recurrence: RecurrencePattern,
    note: Option[String],
    tags: Set[String],
    hidden: Boolean,
    category: Option[Category] = None,
    createdAt: Option[Instant] = None,
    lastUpdatedAt: Option[Instant] = None
) {
  def withUpdatedNextDate(currentDate: LocalDate): PeriodicTransaction =
    copy(recurrence = recurrence.withUpdatedNextDate(currentDate))

  // TODO: implement
  def toTransaction(date: LocalDate): Transaction = ???
}

final case class RecurrencePattern(
    startDate: LocalDate,
    nextDate: Option[LocalDate],
    endDate: Option[LocalDate],
    interval: PosInt,
    frequency: RecurrenceFrequency
) derives Codec.AsObject {
  def withUpdatedNextDate(currentDate: LocalDate): RecurrencePattern =
    copy(nextDate = Some(genNextDate(currentDate)))
  
  private def genNextDate(currentDate: LocalDate): LocalDate =
    frequency match
      case RecurrenceFrequency.Daily => currentDate.plusDays(interval.value)
      case RecurrenceFrequency.Weekly => currentDate.plusWeeks(interval.value)
      case RecurrenceFrequency.Monthly => currentDate.plusMonths(interval.value)

  def dateSequence(untilDate: LocalDate): List[LocalDate] = {
    @scala.annotation.tailrec
    def generateDates(currentDate: LocalDate, dates: List[LocalDate]): List[LocalDate] =
      if (currentDate.isAfter(untilDate) || endDate.map(_.minusDays(1)).exists(currentDate.isAfter)) dates
      else generateDates(genNextDate(currentDate), currentDate :: dates)

    generateDates(nextDate.getOrElse(startDate), Nil).reverse
  }
}

object RecurrenceFrequency extends EnumType[RecurrenceFrequency](() => RecurrenceFrequency.values, _.print)
enum RecurrenceFrequency:
  case Daily, Weekly, Monthly

final case class CreatePeriodicTransaction(
    userId: UserId,
    categoryId: CategoryId,
    amount: Money,
    recurrence: RecurrencePattern,
    note: Option[String],
    tags: Set[String]
)
