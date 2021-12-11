package expensetracker.category.db

import expensetracker.category.{Category, CategoryColor, CategoryIcon, CategoryId, CategoryKind, CategoryName, CreateCategory}
import expensetracker.auth.user.UserId
import mongo4cats.bson.ObjectId

import java.time.Instant

final case class CategoryEntity(
    _id: ObjectId,
    kind: CategoryKind,
    name: String,
    icon: String,
    color: String,
    userId: Option[ObjectId],
    lastUpdatedAt: Option[Instant]
) {
  def toDomain: Category =
    Category(
      id = CategoryId(_id.toHexString),
      kind = kind,
      name = CategoryName(name),
      icon = CategoryIcon(icon),
      color = CategoryColor(color),
      userId = userId.map(uid => UserId(uid.toHexString))
    )
}

object CategoryEntity {
  def from(cat: Category): CategoryEntity =
    CategoryEntity(
      _id = ObjectId(cat.id.value),
      kind = cat.kind,
      name = cat.name.value,
      icon = cat.icon.value,
      color = cat.color.value,
      userId = cat.userId.map(aid => ObjectId(aid.value)),
      lastUpdatedAt = Some(Instant.now())
    )

  def from(cat: CreateCategory): CategoryEntity =
    CategoryEntity(
      _id = ObjectId(),
      kind = cat.kind,
      name = cat.name.value,
      icon = cat.icon.value,
      color = cat.color.value,
      userId = Some(ObjectId(cat.userId.value)),
      lastUpdatedAt = None
    )
}
