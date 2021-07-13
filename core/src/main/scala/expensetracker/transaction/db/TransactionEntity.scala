package expensetracker.transaction.db

import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId, TransactionKind}
import org.bson.types.ObjectId
import squants.market._

import java.time.LocalDate

final case class TransactionEntity(
    _id: ObjectId,
    accountId: ObjectId,
    categoryId: ObjectId,
    kind: TransactionKind,
    amount: Money,
    date: LocalDate,
    note: Option[String]
) {
  def toDomain: Transaction =
    Transaction(
      id = TransactionId(_id.toHexString),
      accountId = UserId(accountId.toHexString),
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
      new ObjectId(tx.accountId.value),
      new ObjectId(tx.categoryId.value),
      tx.kind,
      tx.amount,
      tx.date,
      tx.note
    )

  def create(tx: CreateTransaction): TransactionEntity =
    TransactionEntity(
      new ObjectId(),
      new ObjectId(tx.accountId.value),
      new ObjectId(tx.categoryId.value),
      tx.kind,
      tx.amount,
      tx.date,
      tx.note
    )
}
