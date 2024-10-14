package expensetracker.fixtures

import expensetracker.auth.user.UserId
import expensetracker.category.{Category, CategoryColor, CategoryIcon, CategoryId, CategoryKind, CategoryName, CreateCategory}
import mongo4cats.bson.ObjectId

object Categories {
  lazy val cid: CategoryId     = CategoryId(ObjectId().toHexString)
  lazy val cname: CategoryName = CategoryName("cat-1")
  lazy val cid2: CategoryId    = CategoryId(ObjectId().toHexString)

  def cat(
      id: CategoryId = cid,
      kind: CategoryKind = CategoryKind.Expense,
      name: CategoryName = cname,
      icon: CategoryIcon = CategoryIcon("icon"),
      color: CategoryColor = CategoryColor.Blue,
      uid: Option[UserId] = Some(Users.uid1)
  ): Category = Category(id, kind, name, icon, color, uid, hidden = false)

  def create(
      kind: CategoryKind = CategoryKind.Expense,
      name: CategoryName = cname,
      icon: CategoryIcon = CategoryIcon("icon"),
      color: CategoryColor = CategoryColor.Blue,
      uid: UserId = Users.uid1
  ): CreateCategory = CreateCategory(kind, name, icon, color, uid)

}
