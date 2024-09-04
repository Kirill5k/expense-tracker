package expensetracker.common.web

import cats.syntax.option.*
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.category.CategoryKind
import expensetracker.common.validations.{ColorString, EmailString, IdString}
import squants.Money
import squants.market.Currency
import sttp.tapir.{FieldName, Schema}
import sttp.tapir.Schema.SName
import sttp.tapir.SchemaType.{SProduct, SProductField}
import sttp.tapir.generic.auto.SchemaDerivation

transparent trait TapirSchema extends SchemaDerivation {
  given Schema[IdString]       = Schema.string
  given Schema[ColorString]    = Schema.string
  given Schema[NonEmptyString] = Schema.string
  given Schema[EmailString]    = Schema.string

  given Schema[CategoryKind] = Schema.derivedEnumeration[CategoryKind].defaultStringBased

  given Schema[Currency] = Schema(
    SProduct(
      List(
        SProductField(FieldName("code"), Schema.schemaForString, _.code.some),
        SProductField(FieldName("symbol"), Schema.schemaForString, _.symbol.some)
      )
    ),
    Some(SName("Currency"))
  )

  given (using currencySchema: Schema[Currency]): Schema[Money] = Schema(
    SProduct(
      List(
        SProductField(FieldName("currency"), currencySchema, _.currency.some),
        SProductField(FieldName("value"), Schema.schemaForDouble, _.value.some)
      )
    ),
    Some(SName("Money"))
  )
}
