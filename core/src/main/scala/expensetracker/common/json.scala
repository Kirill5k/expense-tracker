package expensetracker.common

import cats.implicits._
import expensetracker.category.CategoryKind
import expensetracker.transaction.TransactionKind
import io.circe.{Decoder, Encoder, Json, JsonObject}
import squants.market.{Currency, Money, defaultMoneyContext}

import scala.util.Try

object json extends JsonCodecs

trait JsonCodecs {
  implicit val decodeMoney: Decoder[Money] = Decoder[JsonObject].emap { json =>
    for {
      rawValue    <- json("value").flatMap(_.asNumber).toRight("missing the actual amount")
      rawCurrency <- json("currency").flatMap(_.asString).toRight("missing currency")
      currency    <- Currency(rawCurrency)(defaultMoneyContext).toEither.leftMap(_.getMessage)
      value       <- Try(rawValue.toDouble).toEither.leftMap(_.getMessage)
    } yield Money(value, currency)
  }

  implicit val encodeMoney: Encoder[Money] = Encoder[JsonObject].contramap { m =>
    JsonObject("value" -> Json.fromBigDecimal(m.amount), "currency" -> Json.fromString(m.currency.code))
  }

  implicit val decodeTransactionKind: Decoder[TransactionKind] = Decoder[String].emap {
    case "expense" => Right(TransactionKind.Expense)
    case "income"  => Right(TransactionKind.Income)
    case other     => Left(s"invalid transaction kind $other")
  }

  implicit val encodeTransactionKind: Encoder[TransactionKind] = Encoder[String].contramap {
    case TransactionKind.Expense => "expense"
    case TransactionKind.Income  => "income"
  }

  implicit val decodeCategoryKind: Decoder[CategoryKind] = Decoder[String].emap {
    case "expense" => Right(CategoryKind.Expense)
    case "income"  => Right(CategoryKind.Income)
    case other     => Left(s"invalid category kind $other")
  }

  implicit val encodeCategoryKind: Encoder[CategoryKind] = Encoder[String].contramap {
    case CategoryKind.Expense => "expense"
    case CategoryKind.Income  => "income"
  }
}
