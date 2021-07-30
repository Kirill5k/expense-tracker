package expensetracker

import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import mongo4cats.bson.{Document, ObjectId}

import java.time.Instant

trait MongoOps {

  def categoryDoc(id: CategoryId, name: String, uid: Option[UserId] = None): Document =
    Document(
      Map(
        "_id"    -> ObjectId(id.value),
        "kind"   -> "expense",
        "name"   -> name,
        "icon"   -> "icon",
        "color"  -> "#2962FF",
        "userId" -> uid.map(id => ObjectId(id.value)).orNull
      )
    )

  def accDoc(id: UserId, email: String, password: String = "password"): Document =
    Document(
      Map(
        "_id"              -> ObjectId(id.value),
        "email"            -> email,
        "password"         -> password,
        "name"             -> Document.parse("""{"first":"John","last":"Bloggs"}"""),
        "registrationDate" -> Instant.parse("2021-06-01T00:00:00Z")
      )
    )
}
