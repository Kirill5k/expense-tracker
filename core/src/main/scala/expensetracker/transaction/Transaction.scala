package expensetracker.transaction

import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.common.IdType
import io.circe.{Decoder, Encoder}
import squants.market.Money

import java.time.LocalDate

opaque type TransactionId = String
object TransactionId extends IdType[TransactionId]

enum TransactionKind(val value: String):
  case Expense extends TransactionKind("expense")
  case Income  extends TransactionKind("income")

object TransactionKind {
  def from(value: String): Either[String, TransactionKind] =
    TransactionKind.values.find(_.value == value).toRight(s"Invalid transaction kind $value")

  given decode: Decoder[TransactionKind] = Decoder[String].emap(TransactionKind.from)
  given encode: Encoder[TransactionKind] = Encoder[String].contramap(_.value)
}

final case class Transaction(
    id: TransactionId,
    userId: UserId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: LocalDate,
    note: Option[String],
    tags: Set[String]
)

final case class CreateTransaction(
    userId: UserId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: LocalDate,
    note: Option[String],
    tags: Set[String]
)
