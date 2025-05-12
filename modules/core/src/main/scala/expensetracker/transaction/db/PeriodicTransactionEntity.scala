package expensetracker.transaction.db

import expensetracker.account.AccountId
import expensetracker.account.db.AccountEntity
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.category.db.CategoryEntity
import expensetracker.common.JsonCodecs
import io.circe.generic.semiauto.deriveCodec
import expensetracker.transaction.{CreatePeriodicTransaction, PeriodicTransaction, RecurrenceFrequency, RecurrencePattern, TransactionId}
import io.circe.Codec
import io.circe.refined.*
import mongo4cats.bson.ObjectId
import mongo4cats.circe.MongoJsonCodecs
import squants.market.Money

import java.time.Instant

final case class PeriodicTransactionEntity(
    _id: ObjectId,
    userId: ObjectId,
    categoryId: ObjectId,
    accountId: Option[ObjectId],
    recurrence: RecurrencePattern,
    amount: Money,
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
    
  def toDomain: PeriodicTransaction =
    PeriodicTransaction(
      id = TransactionId(_id),
      userId = UserId(userId),
      categoryId = CategoryId(categoryId),
      accountId = accountId.map(AccountId(_)),
      recurrence = recurrence,
      amount = amount,
      note = note,
      tags = tags.getOrElse(Set.empty),
      category = category.map(_.toDomain),
      account = account.map(_.toDomain),
      hidden = hidden.getOrElse(false),
      createdAt = createdAt,
      lastUpdatedAt = lastUpdatedAt,
    )
}

object PeriodicTransactionEntity extends MongoJsonCodecs with JsonCodecs {
  given rpCodec: Codec[RecurrencePattern]          = deriveCodec[RecurrencePattern]
  given pteCodec: Codec[PeriodicTransactionEntity] = deriveCodec[PeriodicTransactionEntity]

  def create(tx: CreatePeriodicTransaction): PeriodicTransactionEntity =
    PeriodicTransactionEntity(
      _id = ObjectId(),
      userId = tx.userId.toObjectId,
      categoryId = tx.categoryId.toObjectId,
      accountId = tx.accountId.map(_.toObjectId),
      recurrence = tx.recurrence,
      amount = tx.amount,
      note = tx.note,
      tags = Some(tx.tags),
      createdAt = Some(Instant.now),
      lastUpdatedAt = None,
      hidden = Some(false)
    )
}
