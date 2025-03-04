package expensetracker.transaction.db

import expensetracker.accounts.AccountId
import io.circe.Codec
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.category.db.CategoryEntity
import expensetracker.common.json.given
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId}
import mongo4cats.bson.ObjectId
import mongo4cats.circe.given
import squants.market.*

import java.time.{Instant, LocalDate}

final case class TransactionEntity(
    _id: ObjectId,
    userId: ObjectId,
    categoryId: ObjectId,
    accountId: Option[ObjectId],
    parentTransactionId: Option[ObjectId],
    isRecurring: Option[Boolean],
    amount: Money,
    date: LocalDate,
    note: Option[String],
    hidden: Option[Boolean],
    createdAt: Option[Instant],
    lastUpdatedAt: Option[Instant],
    tags: Option[Set[String]],
    category: Option[CategoryEntity] = None
) derives Codec.AsObject {
  def toDomain: Transaction =
    Transaction(
      id = TransactionId(_id),
      userId = UserId(userId),
      categoryId = CategoryId(categoryId),
      accountId = accountId.map(AccountId(_)),
      parentTransactionId = parentTransactionId.map(id => TransactionId(id)),
      isRecurring = isRecurring.getOrElse(false),
      amount = amount,
      date = date,
      note = note,
      tags = tags.getOrElse(Set.empty),
      category = category.map(_.toDomain),
      hidden = hidden.getOrElse(false)
    )
}

object TransactionEntity:
  def create(tx: CreateTransaction): TransactionEntity =
    TransactionEntity(
      _id = ObjectId(),
      userId = tx.userId.toObjectId,
      categoryId = tx.categoryId.toObjectId,
      accountId = tx.accountId.map(_.toObjectId),
      parentTransactionId = None,
      isRecurring = Some(false),
      amount = tx.amount,
      date = tx.date,
      note = tx.note,
      tags = Some(tx.tags),
      createdAt = Some(Instant.now),
      lastUpdatedAt = None,
      hidden = Some(false)
    )
