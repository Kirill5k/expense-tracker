package expensetracker.transaction

import expensetracker.auth.user.UserId
import expensetracker.category.{Category, CategoryId}
import expensetracker.common.types.{EnumType, IdType}
import squants.market.Money

import java.time.LocalDate

opaque type TransactionId = String
object TransactionId extends IdType[TransactionId]

object TransactionKind extends EnumType[TransactionKind](() => TransactionKind.values, _.print)
enum TransactionKind:
  case Expense, Income

final case class Transaction(
    id: TransactionId,
    userId: UserId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: LocalDate,
    note: Option[String],
    tags: Set[String],
    category: Option[Category] = None
)

final case class CreateTransaction(
    userId: UserId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: LocalDate,
    note: Option[String],
    tags: Set[String]
)
