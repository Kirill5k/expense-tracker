package expensetracker.transaction.db

import expensetracker.auth.account.AccountId
import expensetracker.category.CategoryId
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId, TransactionKind}
import org.bson.types.ObjectId
import squants.market._

import java.time.Instant

final case class TransactionEntity(
    id: ObjectId,
    accountId: ObjectId,
    categoryId: ObjectId,
    kind: TransactionKind,
    amount: Money,
    date: Instant,
    note: Option[String]
) {
  def toDomain: Transaction =
    Transaction(
      id = TransactionId(id.toHexString),
      accountId = AccountId(accountId.toHexString),
      categoryId = CategoryId(categoryId.toHexString),
      kind = kind,
      amount = amount,
      date = date,
      note = note
    )
}

object TransactionEntity {

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
