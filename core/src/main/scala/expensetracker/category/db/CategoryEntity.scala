package expensetracker.category.db

import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryName}
import expensetracker.auth.account.AccountId
import org.bson.types.ObjectId

final case class CategoryEntity(
    id: ObjectId,
    name: String,
    icon: String,
    accountId: Option[ObjectId]
) {
  def toDomain: Category =
    Category(
      id = CategoryId(id.toHexString),
      name = CategoryName(name),
      icon = CategoryIcon(name),
      accountId = accountId.map(uid => AccountId(uid.toHexString))
    )
}
