package expensetracker.fixtures

import expensetracker.category.CategoryId
import mongo4cats.bson.ObjectId

object Categories:
  lazy val catid1 = CategoryId(ObjectId().toHexString)
  lazy val catid2 = CategoryId(ObjectId().toHexString)
