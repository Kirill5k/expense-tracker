package expensetracker.category

import expensetracker.common.types.IdType
import expensetracker.auth.user.UserId
import io.circe.{Decoder, Encoder}

opaque type CategoryId = String
object CategoryId extends IdType[CategoryId]

final case class CategoryName(value: String)  extends AnyVal
final case class CategoryIcon(value: String)  extends AnyVal
final case class CategoryColor(value: String) extends AnyVal

object CategoryColor {
  val Cyan       = CategoryColor("#84FFFF")
  val LightBlue  = CategoryColor("#00B0FF")
  val Blue       = CategoryColor("#2962FF")
  val Indigo     = CategoryColor("#304FFE")
  val DeepPurple = CategoryColor("#6200EA")
}

enum CategoryKind(val value: String):
  case Expense extends CategoryKind("expense")
  case Income extends CategoryKind("income")

object CategoryKind {
  def from(value: String): Either[String, CategoryKind] =
    CategoryKind.values.find(_.value == value).toRight(s"Invalid category kind $value")

  given decodeCategoryKind: Decoder[CategoryKind] = Decoder[String].emap(CategoryKind.from)
  given encodeCategoryKind: Encoder[CategoryKind] = Encoder[String].contramap(_.value)
}

final case class Category(
    id: CategoryId,
    kind: CategoryKind,
    name: CategoryName,
    icon: CategoryIcon,
    color: CategoryColor,
    userId: Option[UserId]
)

final case class CreateCategory(
    kind: CategoryKind,
    name: CategoryName,
    icon: CategoryIcon,
    color: CategoryColor,
    userId: UserId
)
