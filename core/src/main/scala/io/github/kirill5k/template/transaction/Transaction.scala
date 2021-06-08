package io.github.kirill5k.template.transaction

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

sealed trait TransactionCategory

final case class Transaction(
    id: TransactionId,
    kind: TransactionKind,
    amount: Money,
    date: Instant,
    category: TransactionCategory,
    user: UserId
)
