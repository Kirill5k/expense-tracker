package expensetracker.transaction.db

import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryName}
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId, TransactionKind, TransactionNote}
import expensetracker.user.UserId
import org.bson.types.ObjectId
import squants.market._

import java.time.Instant

final case class TransactionCategory(
    id: ObjectId,
    name: String,
    icon: String,
    userId: Option[ObjectId]
)

final case class TransactionAmount(
    amount: BigDecimal,
    currency: String
)

sealed trait TransactionEntity {
  def id: ObjectId
  def kind: TransactionKind
  def amount: TransactionAmount
  def date: Instant
  def note: Option[String]

  def toDomain: Option[Transaction]
}

final case class SimpleTransactionEntity(
    id: ObjectId,
    userId: ObjectId,
    categoryId: ObjectId,
    kind: TransactionKind,
    amount: TransactionAmount,
    date: Instant,
    note: Option[String]
) extends TransactionEntity {
  override def toDomain: Option[Transaction] = None
}

final case class JoinedTransactionEntity(
    id: ObjectId,
    userId: ObjectId,
    category: TransactionCategory,
    kind: TransactionKind,
    amount: TransactionAmount,
    date: Instant,
    note: Option[String]
) extends TransactionEntity {
  override def toDomain: Option[Transaction] =
    Transaction(
      id = TransactionId(id.toHexString),
      userId = UserId(userId.toHexString),
      kind = kind,
      category = Category(
        CategoryId(category.id.toHexString),
        CategoryName(category.name),
        CategoryIcon(category.icon),
        category.userId.map(id => UserId(id.toHexString))
      ),
      amount = Money(amount.amount, amount.currency)(defaultMoneyContext),
      date = date,
      note = note.map(n => TransactionNote(n))
    )
}

object TransactionEntity {

  def create(tx: CreateTransaction): TransactionEntity =
    SimpleTransactionEntity(
      new ObjectId(),
      new ObjectId(tx.userId.value),
      new ObjectId(tx.categoryId.value),
      tx.kind,
      TransactionAmount(tx.amount.amount, tx.amount.currency.code),
      tx.date,
      tx.note.map(_.value)
    )
}
