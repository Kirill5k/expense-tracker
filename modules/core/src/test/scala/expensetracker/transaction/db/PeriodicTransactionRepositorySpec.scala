package expensetracker.transaction.db

import cats.effect.IO
import cats.effect.unsafe.IORuntime
import expensetracker.MongoTestSupport
import expensetracker.MongoOps
import expensetracker.account.{AccountId, AccountName}
import expensetracker.auth.user.UserEmail
import expensetracker.category.CategoryId
import expensetracker.common.errors.AppError
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import expensetracker.fixtures.{Accounts, Categories, PeriodicTransactions, Users}
import expensetracker.transaction.RecurrenceCheckpoint
import mongo4cats.bson.ObjectId
import mongo4cats.client.{ClientSession, MongoClient}
import mongo4cats.database.MongoDatabase
import mongo4cats.operations.{Filter, Update}
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec
import squants.market.GBP

import java.time.LocalDate
import scala.concurrent.Future

class PeriodicTransactionRepositorySpec extends AsyncWordSpec with MongoTestSupport with Matchers with MongoOps {

  "PeriodicTransactionRepository" when {
    "create" should {
      "create new transaction and return it with category" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create(accid = None))
            txs  <- repo.getAll(Users.uid1)
          yield txs mustBe List(tx)
        }

      "return an error when trying to create a transaction with invalid category" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            catid = CategoryId(ObjectId.gen)
            res <- repo.create(PeriodicTransactions.create(catid = catid)).attempt
          yield res mustBe Left(AppError.CategoryDoesNotExist(catid))
        }

      "return an error when trying to create a transaction with invalid account" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            accid = AccountId(ObjectId.gen)
            res <- repo.create(PeriodicTransactions.create(accid = Some(accid))).attempt
          yield res mustBe Left(AppError.AccountDoesNotExist(accid))
        }
    }

    "update" should {
      "update existing tx" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            _    <- repo.update(tx.copy(amount = GBP(25.0)))
            txs  <- repo.getAll(Users.uid1)
          yield txs.map(tx => tx.id -> tx.amount) mustBe List(tx.id -> GBP(25.0))
        }

      List("missing", "hidden", "owned by another user").foreach { state =>
        s"reject an update with a $state category without changing the transaction" in
          withEmbeddedMongoDb { case (db, sess) =>
            val cid = CategoryId(ObjectId.gen)
            for
              repo       <- PeriodicTransactionRepository.make(db, sess, false)
              tx         <- repo.create(PeriodicTransactions.create())
              categories <- db.getCollection("categories")
              _          <- IO.whenA(state != "missing")(
                categories
                  .insertOne(
                    categoryDoc(
                      cid,
                      "unavailable category",
                      Some(if state == "owned by another user" then Users.uid2 else Users.uid1),
                      Some(state == "hidden")
                    )
                  )
                  .void
              )
              result <- repo.update(tx.copy(categoryId = cid, amount = GBP(99.0))).attempt
              stored <- repo.getAll(Users.uid1)
            yield
              result mustBe Left(AppError.CategoryDoesNotExist(cid))
              stored.map(t => (t.id, t.categoryId, t.amount)) mustBe List((tx.id, tx.categoryId, tx.amount))
          }

        s"reject an update with a $state account without changing the transaction" in
          withEmbeddedMongoDb { case (db, sess) =>
            val aid = AccountId(ObjectId.gen)
            for
              repo     <- PeriodicTransactionRepository.make(db, sess, false)
              tx       <- repo.create(PeriodicTransactions.create())
              accounts <- db.getCollection("accounts")
              _        <- IO.whenA(state != "missing")(
                accounts
                  .insertOne(
                    accountDoc(
                      aid,
                      if state == "owned by another user" then Users.uid2 else Users.uid1,
                      AccountName("unavailable account")
                    )
                  )
                  .void
              )
              _ <- IO.whenA(state == "hidden")(
                accounts.updateOne(Filter.idEq(aid.toObjectId), Update.set("hidden", true)).void
              )
              result <- repo.update(tx.copy(accountId = Some(aid), amount = GBP(99.0))).attempt
              stored <- repo.getAll(Users.uid1)
            yield
              result mustBe Left(AppError.AccountDoesNotExist(aid))
              stored.map(t => (t.id, t.accountId, t.amount)) mustBe List((tx.id, tx.accountId, tx.amount))
          }
      }

      "allow removing an account assignment" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            _    <- repo.update(tx.copy(accountId = None))
            txs  <- repo.getAll(Users.uid1)
          yield txs.map(_.accountId) mustBe List(None)
        }

      "reject updates to another user's transaction" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo   <- PeriodicTransactionRepository.make(db, sess, false)
            tx     <- repo.create(PeriodicTransactions.create())
            result <- repo.update(tx.copy(userId = Users.uid2, amount = GBP(99.0))).attempt
            stored <- repo.getAll(Users.uid1)
          yield
            result mustBe Left(TransactionDoesNotExist(tx.id))
            stored.map(_.amount) mustBe List(tx.amount)
        }

      "return error when tx does not exist" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            res  <- repo.update(PeriodicTransactions.tx()).attempt
          yield res mustBe Left(TransactionDoesNotExist(PeriodicTransactions.txid))
        }
    }

    "hide" should {
      "update hidden field of a tx" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            _    <- repo.hide(Users.uid1, tx.id)
            txs  <- repo.getAll(Users.uid1)
          yield txs mustBe Nil
        }

      "return error when tx does not exist" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            res  <- repo.hide(Users.uid2, tx.id).attempt
          yield res mustBe Left(TransactionDoesNotExist(tx.id))
        }

      "update hidden field of a tx by category id" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            _    <- repo.create(PeriodicTransactions.create())
            _    <- repo.hideByCategory(Categories.cid, true)
            txs  <- repo.getAll(Users.uid1)
          yield txs mustBe Nil
        }

      "update hidden field of a tx by account id" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            _    <- repo.create(PeriodicTransactions.create())
            _    <- repo.hideByAccount(Accounts.id, true)
            txs  <- repo.getAll(Users.uid1)
          yield txs mustBe Nil
        }
    }

    "save" should {
      "insert new tx into db" in
        withEmbeddedMongoDb { case (db, sess) =>
          val tx = PeriodicTransactions.tx()
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            _    <- repo.save(List(PeriodicTransactions.tx()))
            txs  <- repo.getAll(Users.uid1)
          yield txs.map(_.copy(category = None, createdAt = None, lastUpdatedAt = None, account = None)) mustBe List(tx)
        }

      "update existing tx in db" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            _    <- repo.save(List(tx.copy(amount = GBP(10.0))))
            txs  <- repo.getAll(Users.uid1)
          yield txs.map(tx => tx.id -> tx.amount) mustBe List(tx.id -> GBP(10.0))
        }
    }

    "advanceRecurrences" should {
      "only validate captured checkpoints for visible unchanged schedules owned by their user" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo   <- PeriodicTransactionRepository.make(db, sess, false)
            valid  <- repo.create(PeriodicTransactions.create())
            edited <- repo.create(PeriodicTransactions.create())
            hidden <- repo.create(PeriodicTransactions.create())
            snapshots = List(valid, edited, hidden).map(tx => RecurrenceCheckpoint(tx.id, tx.userId, tx.recurrence, None))
            _          <- repo.update(edited.copy(recurrence = edited.recurrence.copy(nextDate = Some(LocalDate.of(2025, 1, 1)))))
            _          <- repo.hide(hidden.userId, hidden.id)
            validIds   <- repo.validCheckpointIds(snapshots :+ snapshots.head.copy(id = PeriodicTransactions.txid))
            foreignIds <- repo.validCheckpointIds(List(snapshots.head.copy(userId = Users.uid2)))
            _          <- repo.deleteAll(valid.userId)
            deletedIds <- repo.validCheckpointIds(snapshots)
          yield {
            validIds mustBe Set(valid.id)
            foreignIds mustBe Set.empty
            deletedIds mustBe Set.empty
          }
        }

      "advance only the checkpoint and preserve unrelated edits" in
        withEmbeddedMongoDb { case (db, sess) =>
          val nextDate = LocalDate.of(2025, 1, 10)
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            checkpoint = RecurrenceCheckpoint(tx.id, tx.userId, tx.recurrence, Some(nextDate))
            _   <- repo.update(tx.copy(note = Some("edited while generating")))
            _   <- repo.advanceRecurrences(List(checkpoint))
            _   <- repo.advanceRecurrences(List(checkpoint))
            txs <- repo.getAll(Users.uid1)
          yield {
            txs.map(_.recurrence.nextDate) mustBe List(Some(nextDate))
            txs.map(_.note) mustBe List(Some("edited while generating"))
          }
        }

      "ignore an outdated checkpoint after the recurrence has been edited" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            changed = tx.recurrence.copy(nextDate = Some(LocalDate.of(2025, 2, 10)))
            _   <- repo.update(tx.copy(recurrence = changed))
            _   <- repo.advanceRecurrences(List(RecurrenceCheckpoint(tx.id, tx.userId, tx.recurrence, Some(LocalDate.of(2025, 1, 10)))))
            txs <- repo.getAll(Users.uid1)
          yield txs.map(_.recurrence) mustBe List(changed)
        }

      "never recreate deleted schedules or restore archived schedules" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            checkpoint = RecurrenceCheckpoint(tx.id, tx.userId, tx.recurrence, Some(LocalDate.of(2025, 1, 10)))
            _        <- repo.hide(tx.userId, tx.id)
            _        <- repo.advanceRecurrences(List(checkpoint))
            hidden   <- repo.getAll(tx.userId)
            _        <- repo.hide(tx.userId, tx.id, false)
            restored <- repo.getAll(tx.userId)
            _        <- repo.deleteAll(tx.userId)
            _        <- repo.advanceRecurrences(List(checkpoint))
            deleted  <- repo.getAll(tx.userId)
          yield {
            hidden mustBe Nil
            restored.map(_.recurrence) mustBe List(tx.recurrence)
            deleted mustBe Nil
          }
        }
    }

    "getAllByRecurrenceDate" should {
      "include overdue transactions even when their end date passed during downtime" in
        withEmbeddedMongoDb { case (db, sess) =>
          val date       = LocalDate.of(2024, 10, 10)
          val recurrence = PeriodicTransactions.recurrence.copy(
            startDate = date.minusMonths(2),
            nextDate = Some(date.minusMonths(1)),
            endDate = Some(date.minusDays(1))
          )
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create(recurrence = recurrence))
            txs  <- repo.getAllByRecurrenceDate(date)
          yield txs mustBe List(tx.copy(category = None, account = None))
        }

      "recover an overdue schedule whose initial checkpoint was never saved" in
        withEmbeddedMongoDb { case (db, sess) =>
          val date       = LocalDate.of(2024, 10, 10)
          val recurrence = PeriodicTransactions.recurrence.copy(startDate = date.minusMonths(1), nextDate = None)
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create(recurrence = recurrence))
            txs  <- repo.getAllByRecurrenceDate(date)
          yield txs mustBe List(tx.copy(category = None, account = None))
        }

      "exclude hidden overdue schedules" in
        withEmbeddedMongoDb { case (db, sess) =>
          val date       = LocalDate.of(2024, 10, 10)
          val recurrence = PeriodicTransactions.recurrence.copy(nextDate = Some(date.minusDays(1)))
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create(recurrence = recurrence))
            _    <- repo.hide(Users.uid1, tx.id)
            txs  <- repo.getAllByRecurrenceDate(date)
          yield txs mustBe Nil
        }

      "exclude future schedules without a checkpoint" in
        withEmbeddedMongoDb { case (db, sess) =>
          val date       = LocalDate.of(2024, 10, 10)
          val recurrence = PeriodicTransactions.recurrence.copy(startDate = date.plusDays(1), nextDate = None)
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            _    <- repo.create(PeriodicTransactions.create(recurrence = recurrence))
            txs  <- repo.getAllByRecurrenceDate(date)
          yield txs mustBe Nil
        }

      "return all periodic transactions that are due to be executed on provided date" in
        withEmbeddedMongoDb { case (db, sess) =>
          val date       = LocalDate.of(2024, 10, 10)
          val recurrence = PeriodicTransactions.recurrence.copy(nextDate = Some(date))
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create(recurrence = recurrence))
            txs  <- repo.getAllByRecurrenceDate(date)
          yield txs mustBe List(tx.copy(category = None, account = None))
        }

      "return all periodic transactions that are due to be executed on provided date when end date is after provided date" in
        withEmbeddedMongoDb { case (db, sess) =>
          val date       = LocalDate.of(2024, 10, 10)
          val recurrence = PeriodicTransactions.recurrence.copy(nextDate = Some(date), endDate = Some(date.plusDays(1)))
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create(recurrence = recurrence))
            txs  <- repo.getAllByRecurrenceDate(date)
          yield txs mustBe List(tx.copy(category = None, account = None))
        }

      "not return periodic transaction if its end date is same or before provided date" in
        withEmbeddedMongoDb { case (db, sess) =>
          val date       = LocalDate.of(2024, 10, 10)
          val recurrence = PeriodicTransactions.recurrence.copy(nextDate = Some(date), endDate = Some(date))
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            _    <- repo.create(PeriodicTransactions.create(recurrence = recurrence))
            txs  <- repo.getAllByRecurrenceDate(date)
          yield txs mustBe Nil
        }

      "not return anything when date is not matching" in
        withEmbeddedMongoDb { case (db, sess) =>
          val date       = LocalDate.of(2024, 10, 10)
          val recurrence = PeriodicTransactions.recurrence.copy(nextDate = Some(date.plusDays(1)))
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            _    <- repo.create(PeriodicTransactions.create(recurrence = recurrence))
            txs  <- repo.getAllByRecurrenceDate(date)
          yield txs mustBe Nil
        }
    }
  }

  def withEmbeddedMongoDb[A](test: (MongoDatabase[IO], ClientSession[IO]) => IO[A]): Future[A] =
    withAvailableMongoPort { port =>
      MongoClient
        .fromConnectionString[IO](s"mongodb://localhost:$port")
        .flatMap { mc =>
          mc.startSession.map(cs => mc -> cs)
        }
        .use { case (client, sess) =>
          for
            db         <- client.getDatabase("expense-tracker")
            accounts   <- db.getCollection("accounts")
            _          <- accounts.insertMany(List(accountDoc(Accounts.id, Users.uid1, AccountName("test-account"))))
            categories <- db.getCollection("categories")
            _          <- categories.insertMany(List(categoryDoc(Categories.cid, "category-1"), categoryDoc(Categories.cid2, "category-2")))
            accs       <- db.getCollection("users")
            _          <- accs.insertMany(List(userDoc(Users.uid1, UserEmail("acc-1")), userDoc(Users.uid2, UserEmail("acc-2"))))
            res        <- test(db, sess)
          yield res
        }
    }.unsafeToFuture()(using IORuntime.global)
}
