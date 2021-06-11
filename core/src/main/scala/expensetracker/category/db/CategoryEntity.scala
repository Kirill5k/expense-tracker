package expensetracker.category.db

import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryName}
import expensetracker.user.UserId
import org.bson.types.ObjectId

final case class CategoryEntity(
    id: ObjectId,
    name: String,
    icon: String,
    userId: Option[ObjectId]
) {
  def toDomain: Category =
    Category(
      id = CategoryId(id.toHexString),
      name = CategoryName(name),
      icon = CategoryIcon(name),
      userId = userId.map(uid => UserId(uid.toHexString))
    )
}
