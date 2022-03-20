package expensetracker.common

import cats.syntax.either.*
import expensetracker.auth.session.SessionStatus
import expensetracker.category.CategoryKind
import expensetracker.transaction.TransactionKind
import io.circe.{Decoder, Encoder, Json, JsonObject}
import squants.market.{Currency, Money, defaultMoneyContext}

import java.net.InetSocketAddress
import scala.util.Try

object json extends JsonCodecs

trait JsonCodecs {
  inline given Decoder[InetSocketAddress] = Decoder[String].emapTry { ip =>
    Try(ip.split(":")).flatMap { address =>
      val host = address.headOption.getOrElse("0.0.0.0")
      val port = address.drop(1).headOption.getOrElse("80")
      Try(InetSocketAddress.createUnresolved(host, port.toInt))
    }
  }
  inline given Encoder[InetSocketAddress] = Encoder[String].contramap(_.toString)

  inline given currDec: Decoder[Currency] = Decoder[JsonObject].emap { json =>
    for {
      code     <- json("code").flatMap(_.asString).toRight("missing currency code")
      currency <- Currency(code)(defaultMoneyContext).toEither.leftMap(_.getMessage)
    } yield currency
  }

  inline given currEnc: Encoder[Currency] = Encoder[JsonObject].contramap { c =>
    JsonObject(
      "code"   -> Json.fromString(c.code),
      "symbol" -> Json.fromString(c.symbol)
    )
  }

  inline given monDec(using d: Decoder[Currency]): Decoder[Money] = Decoder[JsonObject].emap { json =>
    for {
      rawValue    <- json("value").flatMap(_.asNumber).toRight("missing the actual amount")
      rawCurrency <- json("currency").toRight("missing currency")
      currency    <- d.decodeJson(rawCurrency).leftMap(_.message)
      value       <- Try(rawValue.toDouble).map(roundUp).toEither.leftMap(_.getMessage)
    } yield Money(value, currency)
  }

  inline given monEnc(using e: Encoder[Currency]): Encoder[Money] = Encoder[JsonObject].contramap { m =>
    JsonObject(
      "value"    -> Json.fromBigDecimal(roundUp(m.amount)),
      "currency" -> e(m.currency)
    )
  }

  private def roundUp(value: BigDecimal): BigDecimal = value.setScale(2, BigDecimal.RoundingMode.HALF_UP)
  private def roundUp(value: Double): BigDecimal     = roundUp(BigDecimal(value))
}
