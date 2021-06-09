package expensetracker.transaction

import cats.implicits._
import expensetracker.category.{Category, CategoryId}
import expensetracker.user.UserId
import io.circe.{Decoder, Encoder, Json, JsonObject}
import squants.market.{Currency, Money, defaultMoneyContext}

import java.time.Instant
import scala.util.Try

final case class TransactionId(value: String)   extends AnyVal
final case class TransactionNote(value: String) extends AnyVal

sealed trait TransactionKind
object TransactionKind {
  case object Expense extends TransactionKind
  case object Income  extends TransactionKind

  implicit val decodeTransactionKind: Decoder[TransactionKind] = Decoder[String].emap {
    case "expense" => Right(Expense)
    case "income"  => Right(Income)
    case other     => Left(s"invalid transaction kind $other")
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

object Transaction {
  implicit val decodeMoney: Decoder[Money] = Decoder[JsonObject].emap { json =>
    for {
      rawValue    <- json("value").flatMap(_.asNumber).toRight("missing the actual amount")
      rawCurrency <- json("currency").flatMap(_.asString).toRight("missing currency")
      currency    <- Currency(rawCurrency)(defaultMoneyContext).toEither.leftMap(_.getMessage)
      value       <- Try(rawValue.toDouble).toEither.leftMap(_.getMessage)
    } yield Money(value, currency)
  }

  implicit val encodeMoney: Encoder[Money] = Encoder[JsonObject].contramap { amount =>
    JsonObject("value" -> Json.fromBigDecimal(amount.amount), "currency" -> Json.fromString(amount.currency.code))
  }
}

final case class CreateTransaction(
    userId: UserId,
    kind: TransactionKind,
    categoryId: CategoryId,
    amount: Money,
    date: Instant,
    note: Option[TransactionNote]
)
