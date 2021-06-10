package expensetracker.transaction.db

import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryName}
import expensetracker.common.errors.AppError
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId, TransactionKind}
import expensetracker.user.UserId
import org.bson.types.ObjectId
import squants.market._

import java.time.Instant

final case class TransactionCategory(
    id: ObjectId,
    name: String,
    icon: String,
    userId: Option[ObjectId]
) {
  def toDomain: Category =
    Category(
      CategoryId(id.toHexString),
      CategoryName(name),
      CategoryIcon(icon),
      userId.map(uid => UserId(uid.toHexString))
    )
}

final case class TransactionEntity(
    id: ObjectId,
    userId: ObjectId,
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
          userId = UserId(userId.toHexString),
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
      new ObjectId(tx.userId.value),
      new ObjectId(tx.categoryId.value),
      None,
      tx.kind,
      tx.amount,
      tx.date,
      tx.note
    )
}
