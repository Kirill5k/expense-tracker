package expensetracker

import expensetracker.auth.user.{PasswordHash, UserEmail, UserId}
import expensetracker.category.CategoryId
import mongo4cats.bson.Document
import mongo4cats.bson.syntax.*

import java.time.Instant

trait MongoOps {

  def categoryDoc(id: CategoryId, name: String, uid: Option[UserId] = None, hidden: Option[Boolean] = None): Document =
    Document(
      "_id"    := id.toObjectId,
      "kind"   := "expense",
      "name"   := name,
      "icon"   := "icon",
      "color"  := "#2962FF",
      "userId" := uid.map(id => id.toObjectId),
      "hidden" := hidden
    )

  def userDoc(
      id: UserId,
      email: UserEmail,
      password: PasswordHash = PasswordHash("password"),
      registrationDate: Instant = Instant.parse("2021-06-01T00:00:00Z")
  ): Document =
    Document(
      "_id"              := id.toObjectId,
      "email"            := email.value,
      "password"         := password.value,
      "name"             := Document.parse("""{"first":"John","last":"Bloggs"}"""),
      "registrationDate" := registrationDate
    )
}
