package expensetracker.fixtures

import expensetracker.transaction.{CreatePeriodicTransaction, PeriodicTransaction, RecurrenceFrequency, RecurrencePattern, TransactionId}
import mongo4cats.bson.ObjectId
import eu.timepit.refined.*
import eu.timepit.refined.numeric.Positive
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import squants.Money
import squants.market.GBP

import java.time.LocalDate

object PeriodicTransactions {

  lazy val txid: TransactionId  = TransactionId(ObjectId().toHexString)
  lazy val txid2: TransactionId = TransactionId(ObjectId().toHexString)

  lazy val recurrence: RecurrencePattern = RecurrencePattern(
    startDate = LocalDate.now(),
    nextDate = None,
    endDate = None,
    interval = refineV[Positive].unsafeFrom(1),
    frequency = RecurrenceFrequency.Monthly
  )

  def tx(
      id: TransactionId = txid,
      uid: UserId = Users.uid1,
      catid: CategoryId = Categories.cid,
      amount: Money = GBP(15.0),
      recurrence: RecurrencePattern = recurrence,
      note: Option[String] = Some("test tx"),
      tags: Set[String] = Set("foo")
  ): PeriodicTransaction = PeriodicTransaction(
    id = id,
    userId = uid,
    categoryId = catid,
    recurrence = recurrence,
    amount = amount,
    note = note,
    tags = tags,
    hidden = false
  )

  def create(
      uid: UserId = Users.uid1,
      catid: CategoryId = Categories.cid,
      amount: Money = GBP(15.0),
      recurrence: RecurrencePattern = recurrence,
      note: Option[String] = Some("test tx"),
      tags: Set[String] = Set("foo")
  ): CreatePeriodicTransaction = CreatePeriodicTransaction(uid, catid, amount, recurrence, note, tags)

  val txjson =
    s"""{
       |    "id" : "${txid}",
       |    "categoryId" : "${Categories.cid}",
       |    "amount" : {
       |      "value" : 15.00,
       |      "currency": {"code":"GBP","symbol":"£"}
       |    },
       |    "recurrence": {
       |      "startDate": "${LocalDate.now}",
       |      "interval": 1,
       |      "nextDate" : null,
       |      "endDate" : null,
       |      "frequency": "monthly"
       |    },
       |    "note" : "test tx",
       |    "tags" : ["foo"],
       |    "category" : null
       |  }""".stripMargin
}
