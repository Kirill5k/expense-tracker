package expensetracker.transaction.db

import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryKind, CategoryName}
import expensetracker.common.errors.AppError
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId, TransactionKind}
import expensetracker.auth.account.AccountId
import org.bson.types.ObjectId
import squants.market._

import java.time.Instant

final case class TransactionCategory(
    _id: ObjectId,
    kind: CategoryKind,
    name: String,
    icon: String,
    accountId: Option[ObjectId]
) {
  def toDomain: Category =
    Category(
      CategoryId(_id.toHexString),
      kind,
      CategoryName(name),
      CategoryIcon(icon),
      accountId.map(uid => AccountId(uid.toHexString))
    )
}

final case class TransactionEntity(
    id: ObjectId,
    accountId: ObjectId,
    categoryId: ObjectId,
    category: Option[TransactionCategory],
    kind: TransactionKind,
    amount: Money,
    date: Instant,
    note: Option[String]
) {
  def toDomain: Either[AppError, Transaction] =
    category
      .map(_.toDomain)
      .toRight(AppError.Mongo(s"unable to find category with id ${categoryId.toHexString}"))
      .map { cat =>
        Transaction(
          id = TransactionId(id.toHexString),
          accountId = AccountId(accountId.toHexString),
          kind = kind,
          category = cat,
          amount = amount,
          date = date,
          note = note
        )
      }
}

object TransactionEntity {

  def create(tx: CreateTransaction): TransactionEntity =
    TransactionEntity(
      new ObjectId(),
      new ObjectId(tx.accountId.value),
      new ObjectId(tx.categoryId.value),
      None,
      tx.kind,
      tx.amount,
      tx.date,
      tx.note
    )
}
