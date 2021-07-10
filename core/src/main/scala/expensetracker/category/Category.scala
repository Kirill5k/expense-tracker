package expensetracker.category

import expensetracker.auth.account.AccountId

final case class CategoryId(value: String)    extends AnyVal
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

sealed abstract class CategoryKind(val value: String)
object CategoryKind {
  case object Expense extends CategoryKind("expense")
  case object Income  extends CategoryKind("income")
}

final case class Category(
    id: CategoryId,
    kind: CategoryKind,
    name: CategoryName,
    icon: CategoryIcon,
    color: CategoryColor,
    accountId: Option[AccountId]
)

final case class CreateCategory(
    kind: CategoryKind,
    name: CategoryName,
    icon: CategoryIcon,
    color: CategoryColor,
    accountId: AccountId
)
