package expensetracker.category.db

import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryKind, CategoryName}
import expensetracker.auth.account.AccountId
import org.bson.types.ObjectId

final case class CategoryEntity(
    _id: ObjectId,
    kind: CategoryKind,
    name: String,
    icon: String,
    accountId: Option[ObjectId]
) {
  def toDomain: Category =
    Category(
      id = CategoryId(_id.toHexString),
      kind = kind,
      name = CategoryName(name),
      icon = CategoryIcon(icon),
      accountId = accountId.map(uid => AccountId(uid.toHexString))
    )
}

object CategoryEntity {
  def from(cat: Category): CategoryEntity =
    CategoryEntity(
      _id = new ObjectId(cat.id.value),
      kind = cat.kind,
      name = cat.name.value,
      icon = cat.icon.value,
      accountId = cat.accountId.map(aid => new ObjectId(aid.value))
    )
}
