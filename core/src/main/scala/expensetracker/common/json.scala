package expensetracker.common

import cats.implicits._
import com.comcast.ip4s.IpAddress
import expensetracker.auth.session.SessionStatus
import expensetracker.category.CategoryKind
import expensetracker.transaction.TransactionKind
import io.circe.{Decoder, Encoder, Json, JsonObject}
import squants.market.{Currency, Money, defaultMoneyContext}

import scala.util.Try

object json extends JsonCodecs

trait JsonCodecs {
  implicit val decodeIpAddress: Decoder[IpAddress] = Decoder[String].emap { ip =>
    IpAddress.fromString(ip).toRight(s"invalid ip address $ip")
  }

  implicit val decodeSessionStatus: Decoder[SessionStatus] = Decoder[String].emap(SessionStatus.from)
  implicit val encodeSessionStatus: Encoder[SessionStatus] = Encoder[String].contramap(_.value)

  implicit val encodeIpAddress: Encoder[IpAddress] = Encoder[String].contramap(_.toUriString)

  implicit val decodeCurrency: Decoder[Currency] = Decoder[JsonObject].emap { json =>
    for {
      code     <- json("code").flatMap(_.asString).toRight("missing currency code")
      currency <- Currency(code)(defaultMoneyContext).toEither.leftMap(_.getMessage)
    } yield currency
  }

  implicit val encodeCurrency: Encoder[Currency] = Encoder[JsonObject].contramap { c =>
    JsonObject(
      "code"   -> Json.fromString(c.code),
      "symbol" -> Json.fromString(c.symbol)
    )
  }

  implicit def decodeMoney(implicit d: Decoder[Currency]): Decoder[Money] = Decoder[JsonObject].emap { json =>
    for {
      rawValue    <- json("value").flatMap(_.asNumber).toRight("missing the actual amount")
      rawCurrency <- json("currency").toRight("missing currency")
      currency    <- d.decodeJson(rawCurrency).leftMap(_.message)
      value       <- Try(rawValue.toDouble).toEither.leftMap(_.getMessage)
    } yield Money(value, currency)
  }

  implicit def encodeMoney(implicit e: Encoder[Currency]): Encoder[Money] = Encoder[JsonObject].contramap { m =>
    JsonObject(
      "value"    -> Json.fromBigDecimal(m.amount),
      "currency" -> e(m.currency)
    )
  }

  implicit val decodeTransactionKind: Decoder[TransactionKind] = Decoder[String].emap(TransactionKind.from)
  implicit val encodeTransactionKind: Encoder[TransactionKind] = Encoder[String].contramap(_.value)

  implicit val decodeCategoryKind: Decoder[CategoryKind] = Decoder[String].emap(CategoryKind.from)
  implicit val encodeCategoryKind: Encoder[CategoryKind] = Encoder[String].contramap(_.value)
}
