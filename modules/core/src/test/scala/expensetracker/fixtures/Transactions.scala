package expensetracker.fixtures

import expensetracker.account.AccountId
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId}
import mongo4cats.bson.ObjectId
import squants.Money
import squants.market.GBP

import java.time.LocalDate

object Transactions {

  lazy val txid: TransactionId  = TransactionId(ObjectId().toHexString)
  lazy val txid2: TransactionId = TransactionId(ObjectId().toHexString)
  lazy val txdate: LocalDate    = LocalDate.now()

  def tx(
      id: TransactionId = txid,
      uid: UserId = Users.uid1,
      catid: CategoryId = Categories.cid,
      accid: Option[AccountId] = Some(Accounts.id),
      amount: Money = GBP(15.0),
      date: LocalDate = txdate,
      note: Option[String] = Some("test tx"),
      tags: Set[String] = Set("foo")
  ): Transaction = Transaction(
    id = id,
    userId = uid,
    categoryId = catid,
    accountId = accid,
    parentTransactionId = None,
    isRecurring = false,
    amount = amount,
    date = date,
    note = note,
    tags = tags,
    hidden = false
  )

  def create(
      uid: UserId = Users.uid1,
      catid: CategoryId = Categories.cid,
      accid: Option[AccountId] = Some(Accounts.id),
      amount: Money = GBP(15.0),
      date: LocalDate = txdate,
      note: Option[String] = Some("test tx"),
      tags: Set[String] = Set("foo")
  ): CreateTransaction = CreateTransaction(uid, catid, accid, amount, date, note, tags)

  val txjson =
    s"""{
       |    "id" : "${Transactions.txid}",
       |    "categoryId" : "${Categories.cid}",
       |    "accountId" : "${Accounts.id}",
       |    "parentTransactionId" : null,
       |    "isRecurring" : false,
       |    "amount" : {
       |      "value" : 15.00,
       |      "currency":{"code":"GBP","symbol":"£"}
       |    },
       |    "date" : "${Transactions.txdate}",
       |    "note" : "test tx",
       |    "tags" : ["foo"],
       |    "category" : null
       |  }""".stripMargin
}
