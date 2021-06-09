package io.github.kirill5k.template.transaction

import io.github.kirill5k.template.category.Category
import io.github.kirill5k.template.user.UserId
import squants.Money

import java.time.Instant
import java.util.UUID

final case class TransactionId(value: UUID) extends AnyVal

sealed trait TransactionKind
object TransactionKind {
  case object Expense extends TransactionKind
  case object Income  extends TransactionKind
}

final case class Transaction(
    id: TransactionId,
    userId: UserId,
    kind: TransactionKind,
    amount: Money,
    date: Instant,
    category: Category
)
