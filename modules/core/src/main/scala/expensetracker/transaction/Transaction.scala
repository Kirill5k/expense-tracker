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
)

final case class RecurrencePattern(
    startDate: LocalDate,
    endDate: Option[LocalDate],
    interval: PosInt,
    frequency: RecurrenceFrequency,
    nextDate: Option[LocalDate]
) derives Codec.AsObject

object RecurrenceFrequency extends EnumType[RecurrenceFrequency](() => RecurrenceFrequency.values, _.print)
enum RecurrenceFrequency:
  case Daily, Weekly, Monthly
