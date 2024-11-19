package expensetracker.transaction

import expensetracker.auth.user.UserId
import expensetracker.category.{Category, CategoryId}
import expensetracker.common.types.IdType
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
    lastUpdatedAt: Option[Instant] = None,
)

final case class CreateTransaction(
    userId: UserId,
    categoryId: CategoryId,
    amount: Money,
    date: LocalDate,
    note: Option[String],
    tags: Set[String]
)
