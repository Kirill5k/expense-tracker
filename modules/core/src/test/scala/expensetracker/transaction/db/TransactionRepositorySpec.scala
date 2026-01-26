package expensetracker.transaction.db

import cats.effect.IO
import cats.effect.unsafe.IORuntime
import expensetracker.MongoOps
import expensetracker.account.{AccountId, AccountName}
import expensetracker.auth.user.{UserEmail, UserId}
import expensetracker.category.CategoryId
import expensetracker.common.errors.AppError
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import expensetracker.fixtures.{Accounts, Categories, Transactions, Users}
import expensetracker.transaction.{Transaction, TransactionId}
import mongo4cats.bson.ObjectId
import mongo4cats.client.{ClientSession, MongoClient}
import mongo4cats.database.MongoDatabase
import mongo4cats.embedded.EmbeddedMongo
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec
import squants.market.GBP

import java.time.temporal.ChronoUnit
import java.time.Instant
import scala.concurrent.Future

class TransactionRepositorySpec extends AsyncWordSpec with EmbeddedMongo with Matchers with MongoOps {

  override protected val mongoPort: Int = 12349

  "TransactionRepository" when {

    "create" should {
      "create new transaction and return it with category" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            tx   <- repo.create(Transactions.create(accid = None))
            txs  <- repo.getAll(Users.uid1, None, None)
          yield txs mustBe List(tx)
        }

      "return an error when trying to create a transaction with invalid category" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            catid = CategoryId(ObjectId.gen)
            res <- repo.create(Transactions.create(catid = catid)).attempt
          yield res mustBe Left(AppError.CategoryDoesNotExist(catid))
        }

      "return an error when trying to create a transaction with invalid account" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            accid = AccountId(ObjectId.gen)
            res <- repo.create(Transactions.create(accid = Some(accid))).attempt
          yield res mustBe Left(AppError.AccountDoesNotExist(accid))
        }
    }

    "return existing transactions with categories from db" in
      withEmbeddedMongoDb { case (db, sess) =>
        val result = for
          repo <- TransactionRepository.make(db, sess, false)
          _    <- repo.create(Transactions.create())
          _    <- repo.create(Transactions.create(catid = Categories.cid2, amount = GBP(45.0)))
          txs  <- repo.getAll(Users.uid1, None, None)
        yield txs

        result.map { txs =>
          txs must have size 2
          txs.map(_.amount) mustBe List(GBP(15.0), GBP(45.0))
          txs.map(_.categoryId) mustBe List(Categories.cid, Categories.cid2)
          txs.flatMap(_.category.map(_.id)) mustBe List(Categories.cid, Categories.cid2)
        }
      }

    "search transactions by date" in
      withEmbeddedMongoDb { case (db, sess) =>
        for
          repo <- TransactionRepository.make(db, sess, false)
          _    <- repo.create(Transactions.create(date = Transactions.txdate.minusDays(1)))
          _    <- repo.create(Transactions.create(date = Transactions.txdate.minusDays(3)))
          txs  <- repo.getAll(Users.uid1, Some(Instant.now().minus(2, ChronoUnit.DAYS)), None)
        yield txs must have size 1
      }

    "return empty list when transactions are outside provided date range" in
      withEmbeddedMongoDb { case (db, sess) =>
        val from = Instant.now().minus(10, ChronoUnit.DAYS)
        val to   = Instant.now().minus(8, ChronoUnit.DAYS)
        for
          repo <- TransactionRepository.make(db, sess, false)
          _    <- repo.create(Transactions.create(date = Transactions.txdate.minusDays(1)))
          _    <- repo.create(Transactions.create(date = Transactions.txdate.minusDays(3)))
          txs  <- repo.getAll(Users.uid1, Some(from), Some(to))
        yield txs mustBe empty
      }

    "return tx by id from db" in
      withEmbeddedMongoDb { case (db, sess) =>
        for
          repo  <- TransactionRepository.make(db, sess, false)
          newTx <- repo.create(Transactions.create())
          tx    <- repo.get(Users.uid1, newTx.id)
        yield tx.userId mustBe Users.uid1
      }

    "return error when tx does not exist" in
      withEmbeddedMongoDb { case (db, sess) =>
        for
          repo <- TransactionRepository.make(db, sess, false)
          tx   <- repo.create(Transactions.create())
          err  <- repo.get(Users.uid2, tx.id).attempt
        yield err mustBe Left(TransactionDoesNotExist(tx.id))
      }

    "not return transactions that belong to other accounts" in
      withEmbeddedMongoDb { case (db, sess) =>
        for
          repo <- TransactionRepository.make(db, sess, false)
          _    <- repo.create(Transactions.create())
          _    <- repo.create(Transactions.create(catid = Categories.cid2, amount = GBP(45.0)))
          txs  <- repo.getAll(Users.uid2, None, None)
        yield txs must have size 0
      }

    "delete" should {
      "remove account's transaction" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            tx   <- repo.create(Transactions.create())
            _    <- repo.delete(Users.uid1, tx.id)
            txs  <- repo.getAll(Users.uid1, None, None)
          yield txs must have size 0
        }

      "return error if userId doesn't match" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            tx   <- repo.create(Transactions.create())
            res  <- repo.delete(Users.uid2, tx.id).attempt
          yield res mustBe Left(TransactionDoesNotExist(tx.id))
        }
    }

    "update" should {
      "update existing tx" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            tx   <- repo.create(Transactions.create())
            _    <- repo.update(tx.copy(amount = GBP(25.0)))
            txs  <- repo.getAll(Users.uid1, None, None)
          yield txs.map(tx => tx.id -> tx.amount) mustBe List(tx.id -> GBP(25.0))
        }

      "return error when tx does not exist" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            res  <- repo.update(Transactions.tx()).attempt
          yield res mustBe Left(TransactionDoesNotExist(Transactions.txid))
        }
    }

    "hide" should {
      "update hidden field of a tx" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            tx   <- repo.create(Transactions.create())
            _    <- repo.hide(Users.uid1, tx.id)
            txs  <- repo.getAll(Users.uid1, None, None)
          yield txs mustBe Nil
        }

      "return error when tx does not exist" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            tx   <- repo.create(Transactions.create())
            res  <- repo.hide(Users.uid2, tx.id).attempt
          yield res mustBe Left(TransactionDoesNotExist(tx.id))
        }

      "update hidden field of a tx by category id" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            _    <- repo.create(Transactions.create())
            _    <- repo.hideByCategory(Categories.cid, true)
            txs  <- repo.getAll(Users.uid1, None, None)
          yield txs mustBe Nil
        }

      "update hidden field of a tx by account id" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            _    <- repo.create(Transactions.create())
            _    <- repo.hideByAccount(Accounts.id, true)
            txs  <- repo.getAll(Users.uid1, None, None)
          yield txs mustBe Nil
        }
    }

    "isHidden" should {
      "return status of a hidden tx" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo   <- TransactionRepository.make(db, sess, false)
            tx     <- repo.create(Transactions.create())
            _      <- repo.hide(Users.uid1, tx.id)
            hidden <- repo.isHidden(Users.uid1, tx.id)
          yield hidden mustBe true
        }

      "return status of a displayed tx" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo   <- TransactionRepository.make(db, sess, false)
            tx     <- repo.create(Transactions.create())
            hidden <- repo.isHidden(Users.uid1, tx.id)
          yield hidden mustBe false
        }
    }

    "save" should {
      "insert new tx into db" in
        withEmbeddedMongoDb { case (db, sess) =>
          val tx = Transactions.tx()
          for
            repo <- TransactionRepository.make(db, sess, false)
            _    <- repo.save(List(Transactions.tx()))
            txs  <- repo.getAll(Users.uid1, None, None)
          yield txs.map(_.copy(category = None, createdAt = None, lastUpdatedAt = None, account = None)) mustBe List(tx)
        }

      "update existing tx in db" in
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- TransactionRepository.make(db, sess, false)
            tx   <- repo.create(Transactions.create())
            _    <- repo.save(List(tx.copy(amount = GBP(10.0))))
            txs  <- repo.getAll(Users.uid1, None, None)
          yield txs.map(tx => tx.id -> tx.amount) mustBe List(tx.id -> GBP(10.0))
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
            categories <- db.getCollection("categories")
            _          <- categories.insertMany(List(categoryDoc(Categories.cid, "category-1"), categoryDoc(Categories.cid2, "category-2")))
            accounts   <- db.getCollection("accounts")
            _          <- accounts.insertMany(List(accountDoc(Accounts.id, Users.uid1, AccountName("test-account"))))
            users      <- db.getCollection("users")
            _          <- users.insertMany(List(userDoc(Users.uid1, UserEmail("acc-1")), userDoc(Users.uid2, UserEmail("acc-2"))))
            res        <- test(db, sess)
          yield res
        }
    }.unsafeToFuture()(using IORuntime.global)
}
