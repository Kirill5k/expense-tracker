package expensetracker.transaction.db

import cats.effect.IO
import cats.effect.unsafe.IORuntime
import expensetracker.MongoOps
import expensetracker.account.{AccountId, AccountName}
import expensetracker.auth.user.UserEmail
import expensetracker.category.CategoryId
import expensetracker.common.errors.AppError
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import expensetracker.fixtures.{Accounts, Categories, PeriodicTransactions, Users}
import mongo4cats.bson.ObjectId
import mongo4cats.client.{ClientSession, MongoClient}
import mongo4cats.database.MongoDatabase
import mongo4cats.embedded.EmbeddedMongo
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec
import squants.market.GBP

import java.time.LocalDate
import scala.concurrent.Future

class PeriodicTransactionRepositorySpec extends AsyncWordSpec with EmbeddedMongo with Matchers with MongoOps {
  override protected val mongoPort: Int = 12353

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

    "getAllByOccurrenceDate" should {
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
            tx   <- repo.create(PeriodicTransactions.create(recurrence = recurrence))
            txs  <- repo.getAllByRecurrenceDate(date)
          yield txs mustBe Nil
        }
    }
  }

  def withEmbeddedMongoDb[A](test: (MongoDatabase[IO], ClientSession[IO]) => IO[A]): Future[A] =
    withRunningEmbeddedMongo {
      MongoClient
        .fromConnectionString[IO](s"mongodb://localhost:$mongoPort")
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
