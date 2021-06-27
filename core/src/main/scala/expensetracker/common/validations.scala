package expensetracker.common

import eu.timepit.refined.api.{Refined, RefinedTypeOps, Validate}
import org.bson.types.ObjectId

object validations {
  type ValidIdString = String Refined ValidId
  object ValidIdString extends RefinedTypeOps[ValidIdString, String]

  final case class ValidId()

  implicit def idValidate[T]: Validate.Plain[T, ValidId] =
    Validate.fromPredicate(id => ObjectId.isValid(id.toString), id => s"($id is valid id)", ValidId())
}
