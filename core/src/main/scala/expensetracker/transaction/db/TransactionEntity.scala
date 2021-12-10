package expensetracker.transaction.db

import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId, TransactionKind}
import mongo4cats.bson.ObjectId
import squants.market._

import java.time.{Instant, LocalDate}

final case class TransactionEntity(
    _id: ObjectId,
    userId: ObjectId,
    categoryId: ObjectId,
    kind: TransactionKind,
    amount: Money,
    date: LocalDate,
    note: Option[String],
    lastUpdatedAt: Option[Instant],
    tags: List[String] = Nil
) {
  def toDomain: Transaction =
    Transaction(
      id = TransactionId(_id.toHexString),
      userId = UserId(userId.toHexString),
      categoryId = CategoryId(categoryId.toHexString),
      kind = kind,
      amount = amount,
      date = date,
      note = note,
      tags = tags
    )
}

object TransactionEntity {

  def from(tx: Transaction): TransactionEntity =
    TransactionEntity(
      ObjectId(tx.id.value),
      ObjectId(tx.userId.value),
      ObjectId(tx.categoryId.value),
      tx.kind,
      tx.amount,
      tx.date,
      tx.note,
      tags = tx.tags,
      lastUpdatedAt = Some(Instant.now())
    )

  def create(tx: CreateTransaction): TransactionEntity =
    TransactionEntity(
      ObjectId(),
      ObjectId(tx.userId.value),
      ObjectId(tx.categoryId.value),
      tx.kind,
      tx.amount,
      tx.date,
      tx.note,
      tags = tx.tags,
      lastUpdatedAt = None
    )
}
