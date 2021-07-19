package expensetracker.transaction.db

import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId, TransactionKind}
import org.bson.types.ObjectId
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
    lastUpdatedAt: Option[Instant]
) {
  def toDomain: Transaction =
    Transaction(
      id = TransactionId(_id.toHexString),
      userId = UserId(userId.toHexString),
      categoryId = CategoryId(categoryId.toHexString),
      kind = kind,
      amount = amount,
      date = date,
      note = note
    )
}

object TransactionEntity {

  def from(tx: Transaction): TransactionEntity =
    TransactionEntity(
      new ObjectId(tx.id.value),
      new ObjectId(tx.userId.value),
      new ObjectId(tx.categoryId.value),
      tx.kind,
      tx.amount,
      tx.date,
      tx.note,
      lastUpdatedAt = Some(Instant.now())
    )

  def create(tx: CreateTransaction): TransactionEntity =
    TransactionEntity(
      new ObjectId(),
      new ObjectId(tx.userId.value),
      new ObjectId(tx.categoryId.value),
      tx.kind,
      tx.amount,
      tx.date,
      tx.note,
      lastUpdatedAt = None
    )
}
