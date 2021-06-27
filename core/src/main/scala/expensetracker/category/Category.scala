package expensetracker.category

import expensetracker.auth.account.AccountId

final case class CategoryId(value: String)   extends AnyVal
final case class CategoryName(value: String) extends AnyVal
final case class CategoryIcon(value: String) extends AnyVal

sealed trait CategoryKind
object CategoryKind {
  case object Expense extends CategoryKind
  case object Income  extends CategoryKind
}

final case class Category(
    id: CategoryId,
    kind: CategoryKind,
    name: CategoryName,
    icon: CategoryIcon,
    accountId: Option[AccountId]
)

final case class CreateCategory(
    kind: CategoryKind,
    name: CategoryName,
    icon: CategoryIcon,
    accountId: AccountId
)
