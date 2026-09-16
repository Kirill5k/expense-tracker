package expensetracker.transaction

import expensetracker.fixtures.PeriodicTransactions
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

import java.time.LocalDate

class PeriodicTransactionSpec extends AnyWordSpec with Matchers {
  "PeriodicTransaction" should {
    "generate an instance of transaction with deterministic id" in {
      val txid = TransactionId("673cb70801452339cd5b4ec1")
      val date = LocalDate.of(2024, 10, 10)
      val ptx  = PeriodicTransactions.tx(id = txid)

      val tx = ptx.toTransaction(date)

      tx mustBe Transaction(
        id = TransactionId("67071900f0844c2b758161c0"),
        userId = ptx.userId,
        categoryId = ptx.categoryId,
        accountId = ptx.accountId,
        parentTransactionId = Some(ptx.id),
        isRecurring = true,
        amount = ptx.amount,
        date = date,
        note = ptx.note,
        tags = ptx.tags,
        hidden = false
      )
    }

    "leave generated transactions unassigned when the schedule has no account" in {
      val ptx = PeriodicTransactions.tx(accid = None)

      ptx.toTransaction(LocalDate.of(2024, 10, 10)).accountId mustBe None
    }
  }
}
