package expensetracker.transaction

import expensetracker.auth.account.AccountId
import expensetracker.category.CategoryId
import squants.market.Money

import java.time.Instant

final case class TransactionId(value: String) extends AnyVal

sealed trait TransactionKind
object TransactionKind {
  case object Expense extends TransactionKind
  case object Income  extends TransactionKind
}

final case class Transaction(
    id: TransactionId,
    accountId: AccountId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: Instant,
    note: Option[String]
)

final case class CreateTransaction(
    accountId: AccountId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: Instant,
    note: Option[String]
)
