package io.github.kirill5k.template.transaction

import io.circe.{Decoder, Encoder}
import io.github.kirill5k.template.category.{Category, CategoryId}
import io.github.kirill5k.template.user.UserId
import squants.Money

import java.time.Instant

final case class TransactionId(value: String)   extends AnyVal
final case class TransactionNote(value: String) extends AnyVal

sealed trait TransactionKind
object TransactionKind {
  case object Expense extends TransactionKind
  case object Income  extends TransactionKind

  implicit val decodeTransactionKind: Decoder[TransactionKind] = Decoder[String].emap {
    case "expense" => Right(Expense)
    case "income"  => Right(Income)
    case other     => Left(s"Invalid transaction kind $other")
  }

  implicit val encodeTransactionKind: Encoder[TransactionKind] = Encoder[String].contramap {
    case Expense => "expense"
    case Income  => "income"
  }
}

final case class Transaction(
    id: TransactionId,
    userId: UserId,
    kind: TransactionKind,
    category: Category,
    amount: Money,
    date: Instant,
    note: Option[TransactionNote]
)

final case class CreateTransaction(
    userId: UserId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: Instant,
    note: Option[TransactionNote]
)
