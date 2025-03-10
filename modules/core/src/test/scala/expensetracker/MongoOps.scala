package expensetracker

import expensetracker.accounts.{AccountId, AccountName}
import expensetracker.auth.user.{PasswordHash, UserEmail, UserId}
import expensetracker.category.CategoryId
import expensetracker.transaction.TransactionId
import mongo4cats.bson.Document
import mongo4cats.bson.syntax.*
import kirill5k.common.syntax.time.*
import squants.market.Money

import java.time.{Instant, LocalDate}

trait MongoOps {

  def transactionDoc(id: TransactionId, cid: CategoryId, uid: UserId, amount: Money, date: LocalDate = LocalDate.now): Document =
    Document(
      "_id"        := id.toObjectId,
      "kind"       := "expense",
      "categoryId" := cid.toObjectId,
      "userId"     := uid.toObjectId,
      "amount" := Document(
        "value"    := amount.amount,
        "currency" := Document("code" := amount.currency.code, "symbol" := amount.currency.symbol)
      ),
      "date" := date.toInstantAtStartOfDay
    )

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

  def accountDoc(
      id: AccountId,
      uid: UserId,
      name: AccountName
  ): Document =
    Document(
      "_id"      := id.toObjectId,
      "userId"   := uid.toObjectId,
      "name"     := name.value,
      "currency" := Document.parse("""{"code":"GBP","symbol":"£"}""")
    )
}
