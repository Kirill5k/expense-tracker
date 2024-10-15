package expensetracker.transaction.db

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
      ObjectId(),
      tx.userId.toObjectId,
      tx.categoryId.toObjectId,
      tx.amount,
      tx.date,
      tx.note,
      tags = Some(tx.tags),
      createdAt = Some(Instant.now),
      lastUpdatedAt = None,
      hidden = Some(false)
    )
