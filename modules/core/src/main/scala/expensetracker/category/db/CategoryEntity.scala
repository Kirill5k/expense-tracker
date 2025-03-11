package expensetracker.category.db

import io.circe.Codec
import expensetracker.category.{Category, CategoryColor, CategoryIcon, CategoryId, CategoryKind, CategoryName, CreateCategory}
import expensetracker.auth.user.UserId
import mongo4cats.bson.ObjectId
import mongo4cats.circe.given

import java.time.Instant

final case class CategoryEntity(
    _id: ObjectId,
    kind: CategoryKind,
    name: String,
    icon: String,
    color: String,
    hidden: Option[Boolean],
    createdAt: Option[Instant],
    userId: Option[ObjectId],
    lastUpdatedAt: Option[Instant]
) derives Codec.AsObject {
  def toDomain: Category =
    Category(
      id = CategoryId(_id),
      kind = kind,
      name = CategoryName(name),
      icon = CategoryIcon(icon),
      color = CategoryColor(color),
      userId = userId.map(uid => UserId(uid)),
      hidden = hidden.getOrElse(false),
      lastUpdatedAt = lastUpdatedAt,
      createdAt = createdAt
    )
}

object CategoryEntity {
  def from(cat: CreateCategory): CategoryEntity =
    CategoryEntity(
      _id = ObjectId(),
      kind = cat.kind,
      name = cat.name.value,
      icon = cat.icon.value,
      color = cat.color.value,
      hidden = Some(false),
      userId = Some(cat.userId.toObjectId),
      createdAt = Some(Instant.now),
      lastUpdatedAt = None
    )
}
