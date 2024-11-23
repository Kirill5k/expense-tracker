package expensetracker.category

import expensetracker.common.types.{EnumType, IdType, StringType}
import expensetracker.auth.user.UserId

import java.time.Instant

opaque type CategoryId = String
object CategoryId extends IdType[CategoryId]

opaque type CategoryName = String
object CategoryName extends StringType[CategoryName]

opaque type CategoryIcon = String
object CategoryIcon extends StringType[CategoryIcon]

opaque type CategoryColor = String
object CategoryColor extends StringType[CategoryColor] {
  val Cyan       = CategoryColor("#84FFFF")
  val LightBlue  = CategoryColor("#00B0FF")
  val Blue       = CategoryColor("#2962FF")
  val Indigo     = CategoryColor("#304FFE")
  val DeepPurple = CategoryColor("#6200EA")
}

object CategoryKind extends EnumType[CategoryKind](() => CategoryKind.values, _.print)
enum CategoryKind:
  case Expense, Income

final case class Category(
    id: CategoryId,
    kind: CategoryKind,
    name: CategoryName,
    icon: CategoryIcon,
    color: CategoryColor,
    userId: Option[UserId],
    hidden: Boolean,
    createdAt: Option[Instant] = None,
    lastUpdatedAt: Option[Instant] = None
)

final case class CreateCategory(
    kind: CategoryKind,
    name: CategoryName,
    icon: CategoryIcon,
    color: CategoryColor,
    userId: UserId
)
