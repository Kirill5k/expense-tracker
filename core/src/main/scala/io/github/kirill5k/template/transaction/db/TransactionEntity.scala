package io.github.kirill5k.template.transaction.db

import io.github.kirill5k.template.transaction.{CreateTransaction, TransactionKind}
import org.bson.types.ObjectId

import java.time.Instant

final case class TransactionAmount(
    amount: BigDecimal,
    currency: String
)

final case class TransactionEntity(
    id: ObjectId,
    userId: ObjectId,
    categoryId: ObjectId,
    kind: TransactionKind,
    amount: TransactionAmount,
    date: Instant,
    note: Option[String]
)

object TransactionEntity {

  def create(tx: CreateTransaction): TransactionEntity =
    TransactionEntity(
      new ObjectId(),
      new ObjectId(tx.userId.value),
      new ObjectId(tx.categoryId.value),
      tx.kind,
      TransactionAmount(tx.amount.amount, tx.amount.currency.code),
      tx.date,
      tx.note.map(_.value)
    )
}
