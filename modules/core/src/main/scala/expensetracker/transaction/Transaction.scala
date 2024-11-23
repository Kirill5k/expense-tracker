package expensetracker.transaction

import eu.timepit.refined.types.numeric.PosInt
import expensetracker.auth.user.UserId
import expensetracker.category.{Category, CategoryId}
import expensetracker.common.types.{EnumType, IdType}
import io.circe.Codec
import io.circe.refined.*
import kirill5k.common.syntax.time.*
import mongo4cats.bson.ObjectId
import squants.market.Money

import java.security.MessageDigest
import java.nio.ByteBuffer
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

  def toTransaction(date: LocalDate): Transaction = {
    val ts     = date.toInstantAtStartOfDay.getEpochSecond.toInt
    val buffer = ByteBuffer.allocate(12)
    buffer.putInt(ts)
    val hashInput = id.value + "_" + date
    val hash      = MessageDigest.getInstance("SHA-256").digest(hashInput.getBytes("UTF-8"))
    buffer.put(hash, 0, 8)
    val oid = ObjectId(buffer.array())

    Transaction(
      id = TransactionId(oid.toHexString),
      userId = userId,
      categoryId = categoryId,
      parentTransactionId = Some(id),
      isRecurring = true,
      amount = amount,
      date = date,
      note = note,
      tags = tags,
      hidden = false
    )
  }
}

final case class RecurrencePattern(
    startDate: LocalDate,
    nextDate: Option[LocalDate],
    endDate: Option[LocalDate],
    interval: PosInt,
    frequency: RecurrenceFrequency
) derives Codec.AsObject {
  def withUpdatedNextDate(currentDate: LocalDate): RecurrencePattern =
    if (currentDate.isBefore(startDate)) copy(nextDate = Some(startDate))
    else copy(nextDate = Some(genNextDate(currentDate)))

  private def genNextDate(currentDate: LocalDate): LocalDate =
    frequency match
      case RecurrenceFrequency.Daily   => currentDate.plusDays(interval.value)
      case RecurrenceFrequency.Weekly  => currentDate.plusWeeks(interval.value)
      case RecurrenceFrequency.Monthly => currentDate.plusMonths(interval.value)

  def dateSequence(untilDate: LocalDate): List[LocalDate] = {
    @scala.annotation.tailrec
    def generateDates(currentDate: LocalDate, dates: List[LocalDate]): List[LocalDate] =
      if (currentDate.isAfter(untilDate) || endDate.map(_.minusDays(1)).exists(currentDate.isAfter)) dates
      else generateDates(genNextDate(currentDate), currentDate :: dates)

    generateDates(nextDate.getOrElse(startDate), Nil)
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
