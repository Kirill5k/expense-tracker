package expensetracker.fixtures

import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId, TransactionKind}
import mongo4cats.bson.ObjectId
import squants.Money
import squants.market.GBP

import java.time.LocalDate

object Transactions {

  lazy val txid: TransactionId = TransactionId(ObjectId().toHexString)

  def tx(
      id: TransactionId = txid,
      uid: UserId = Users.uid1,
      kind: TransactionKind = TransactionKind.Expense,
      catid: CategoryId = Categories.catid1,
      amount: Money = GBP(15.0),
      date: LocalDate = LocalDate.now(),
      note: Option[String] = None,
      tags: Set[String] = Set.empty
  ): Transaction = Transaction(id, uid, kind, catid, amount, date, note, tags)

  def create(
      uid: UserId = Users.uid1,
      kind: TransactionKind = TransactionKind.Expense,
      catid: CategoryId = Categories.catid1,
      amount: Money = GBP(15.0),
      date: LocalDate = LocalDate.now(),
      note: Option[String] = None,
      tags: Set[String] = Set.empty
  ): CreateTransaction = CreateTransaction(uid, kind, catid, amount, date, note, tags)
}
