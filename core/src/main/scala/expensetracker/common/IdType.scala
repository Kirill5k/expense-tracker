package expensetracker.common

import mongo4cats.bson.ObjectId

trait IdType[Id] {
  def apply(id: String): Id = id.asInstanceOf[Id]
  def apply(id: ObjectId): Id = apply(id.toHexString)
  extension (id: Id)
    def value: String = id.asInstanceOf[String]
    def toObjectId: ObjectId = ObjectId(value)
}
