package expensetracker.transaction

import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import squants.market.Money

import java.time.LocalDate

final case class TransactionId(value: String) extends AnyVal

sealed abstract class TransactionKind(val value: String)
object TransactionKind {
  case object Expense extends TransactionKind("expense")
  case object Income  extends TransactionKind("income")

  private val all: List[TransactionKind] = List(Expense, Income)

  def from(value: String): Either[String, TransactionKind] =
    all.find(_.value == value).toRight(s"Invalid transaction kind $value")
}

final case class Transaction(
    id: TransactionId,
    userId: UserId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: LocalDate,
    note: Option[String],
    tags: List[String]
)

final case class CreateTransaction(
    userId: UserId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: LocalDate,
    note: Option[String],
    tags: List[String]
)
