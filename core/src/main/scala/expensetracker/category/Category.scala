package expensetracker.category

import expensetracker.auth.account.AccountId

final case class CategoryId(value: String)   extends AnyVal
final case class CategoryName(value: String) extends AnyVal
final case class CategoryIcon(value: String) extends AnyVal

final case class Category(
    id: CategoryId,
    name: CategoryName,
    icon: CategoryIcon,
    accountId: Option[AccountId]
)

final case class CreateCategory(
    name: CategoryName,
    icon: CategoryIcon,
    accountId: AccountId
)
