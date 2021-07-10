package expensetracker.transaction

import expensetracker.auth.account.AccountId
import expensetracker.category.CategoryId
import squants.market.Money

import java.time.LocalDate

final case class TransactionId(value: String) extends AnyVal

sealed abstract class TransactionKind(val value: String)
object TransactionKind {
  case object Expense extends TransactionKind("expense")
  case object Income  extends TransactionKind("income")
}

final case class Transaction(
    id: TransactionId,
    accountId: AccountId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: LocalDate,
    note: Option[String]
)

final case class CreateTransaction(
    accountId: AccountId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: LocalDate,
    note: Option[String]
)
