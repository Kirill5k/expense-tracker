package expensetracker.fixtures

import expensetracker.auth.user.UserId
import expensetracker.category.{Category, CategoryColor, CategoryIcon, CategoryId, CategoryKind, CategoryName, CreateCategory}
import mongo4cats.bson.ObjectId

object Categories {
  lazy val catid1 = CategoryId(ObjectId().toHexString)
  lazy val catid2 = CategoryId(ObjectId().toHexString)

  def cat(
      id: CategoryId = catid1,
      kind: CategoryKind = CategoryKind.Income,
      name: CategoryName = CategoryName("c2i"),
      icon: CategoryIcon = CategoryIcon("icon"),
      color: CategoryColor = CategoryColor.Blue,
      uid: Option[UserId] = Some(Users.uid1)
  ): Category = Category(id, kind, name, icon, color, uid)

  def create(
      kind: CategoryKind = CategoryKind.Income,
      name: CategoryName = CategoryName("c2i"),
      icon: CategoryIcon = CategoryIcon("icon"),
      color: CategoryColor = CategoryColor.Blue,
      uid: UserId = Users.uid1
  ): CreateCategory = CreateCategory(kind, name, icon, color, uid)

}
