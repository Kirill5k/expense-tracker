package expensetracker.transaction.db

import expensetracker.account.AccountId
import expensetracker.account.db.AccountEntity
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.category.db.CategoryEntity
import expensetracker.common.JsonCodecs
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId}
import io.circe.Codec
import io.circe.generic.semiauto.deriveCodec
import mongo4cats.bson.ObjectId
import mongo4cats.circe.MongoJsonCodecs
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
    category: Option[CategoryEntity] = None,
    account: Option[AccountEntity] = None
) {
  def containsInvalidCategory: Boolean =
    category.isEmpty || category.exists(cat => cat.hidden.getOrElse(false) || cat.userId.exists(_ != userId))

  def containsInvalidAccount: Boolean =
    accountId.isDefined && (
      account.isEmpty ||
        account.exists(acc => acc.hidden.getOrElse(false) || acc.userId != userId)
      )

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
      account = account.map(_.toDomain),
      hidden = hidden.getOrElse(false),
      createdAt = createdAt,
      lastUpdatedAt = lastUpdatedAt
    )
}

object TransactionEntity extends JsonCodecs with MongoJsonCodecs:
  given Codec[TransactionEntity] = deriveCodec[TransactionEntity]
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
