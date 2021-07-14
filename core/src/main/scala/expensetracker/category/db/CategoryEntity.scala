package expensetracker.category.db

import cats.implicits._
import expensetracker.category.{Category, CategoryColor, CategoryIcon, CategoryId, CategoryKind, CategoryName, CreateCategory}
import expensetracker.auth.user.UserId
import org.bson.types.ObjectId

final case class CategoryEntity(
    _id: ObjectId,
    kind: CategoryKind,
    name: String,
    icon: String,
    color: String,
    accountId: Option[ObjectId]
) {
  def toDomain: Category =
    Category(
      id = CategoryId(_id.toHexString),
      kind = kind,
      name = CategoryName(name),
      icon = CategoryIcon(icon),
      color = CategoryColor(color),
      userId = accountId.map(uid => UserId(uid.toHexString))
    )
}

object CategoryEntity {
  def from(cat: Category): CategoryEntity =
    CategoryEntity(
      _id = new ObjectId(cat.id.value),
      kind = cat.kind,
      name = cat.name.value,
      icon = cat.icon.value,
      color = cat.color.value,
      accountId = cat.userId.map(aid => new ObjectId(aid.value))
    )

  def from(cat: CreateCategory): CategoryEntity =
    CategoryEntity(
      _id = new ObjectId(),
      kind = cat.kind,
      name = cat.name.value,
      icon = cat.icon.value,
      color = cat.color.value,
      accountId = new ObjectId(cat.accountId.value).some
    )
}
