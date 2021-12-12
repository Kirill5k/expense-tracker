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
    tags: Option[Set[String]]
) {
  def toDomain: Transaction =
    Transaction(
      id = TransactionId(_id),
      userId = UserId(userId),
      categoryId = CategoryId(categoryId),
      kind = kind,
      amount = amount,
      date = date,
      note = note,
      tags = tags.getOrElse(Set.empty)
    )
}

object TransactionEntity {

  def from(tx: Transaction): TransactionEntity =
    TransactionEntity(
      tx.id.toObjectId,
      tx.userId.toObjectId,
      tx.categoryId.toObjectId,
      tx.kind,
      tx.amount,
      tx.date,
      tx.note,
      tags = Some(tx.tags),
      lastUpdatedAt = Some(Instant.now())
    )

  def create(tx: CreateTransaction): TransactionEntity =
    TransactionEntity(
      ObjectId(),
      tx.userId.toObjectId,
      tx.categoryId.toObjectId,
      tx.kind,
      tx.amount,
      tx.date,
      tx.note,
      tags = Some(tx.tags),
      lastUpdatedAt = None
    )
}
