package expensetracker.transaction.db

import cats.effect.IO
import cats.effect.unsafe.IORuntime
import expensetracker.MongoOps
import expensetracker.auth.user.UserEmail
import expensetracker.category.CategoryId
import expensetracker.common.errors.AppError
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import expensetracker.fixtures.{Categories, PeriodicTransactions, Users}
import mongo4cats.bson.ObjectId
import mongo4cats.client.{ClientSession, MongoClient}
import mongo4cats.database.MongoDatabase
import mongo4cats.embedded.EmbeddedMongo
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec
import squants.market.GBP

import scala.concurrent.Future

class PeriodicTransactionRepositorySpec extends AsyncWordSpec with EmbeddedMongo with Matchers with MongoOps {
  override protected val mongoPort: Int = 12352

  "PeriodicTransactionRepository" when {
    "create" should {
      "create new transaction and return it with category" in {
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            txs  <- repo.getAll(Users.uid1)
          yield txs mustBe List(tx)
        }
      }

      "return an error when trying to create a transaction with invalid category" in {
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            catid = CategoryId(ObjectId.gen)
            res <- repo.create(PeriodicTransactions.create(catid = catid)).attempt
          yield res mustBe Left(AppError.CategoryDoesNotExist(catid))
        }
      }
    }

    "update" should {
      "update existing tx" in {
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            _    <- repo.update(tx.copy(amount = GBP(25.0)))
            txs  <- repo.getAll(Users.uid1)
          yield txs mustBe List(tx.copy(amount = GBP(25.0)))
        }
      }

      "return error when tx does not exist" in {
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            res  <- repo.update(PeriodicTransactions.tx()).attempt
          yield res mustBe Left(TransactionDoesNotExist(PeriodicTransactions.txid))
        }
      }
    }

    "hide" should {
      "update hidden field of a tx" in {
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            _    <- repo.hide(Users.uid1, tx.id)
            txs  <- repo.getAll(Users.uid1)
          yield txs mustBe Nil
        }
      }

      "return error when tx does not exist" in {
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx   <- repo.create(PeriodicTransactions.create())
            res  <- repo.hide(Users.uid2, tx.id).attempt
          yield res mustBe Left(TransactionDoesNotExist(tx.id))
        }
      }

      "update hidden field of a tx by category id" in {
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            _    <- repo.create(PeriodicTransactions.create())
            _    <- repo.hide(Categories.cid, true)
            txs  <- repo.getAll(Users.uid1)
          yield txs mustBe Nil
        }
      }
    }

    "save" should {
      "insert new tx into db" in {
        withEmbeddedMongoDb { case (db, sess) =>
          val tx = PeriodicTransactions.tx()
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            _ <- repo.save(List(PeriodicTransactions.tx()))
            txs <- repo.getAll(Users.uid1)
          yield txs.map(_.copy(category = None)) mustBe List(tx)
        }
      }

      "update existing tx in db" in {
        withEmbeddedMongoDb { case (db, sess) =>
          for
            repo <- PeriodicTransactionRepository.make(db, sess, false)
            tx <- repo.create(PeriodicTransactions.create())
            _ <- repo.save(List(tx.copy(amount = GBP(10.0))))
            txs <- repo.getAll(Users.uid1)
          yield txs mustBe List(tx.copy(amount = GBP(10.0)))
        }
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
            accs       <- db.getCollection("users")
            _          <- accs.insertMany(List(userDoc(Users.uid1, UserEmail("acc-1")), userDoc(Users.uid2, UserEmail("acc-2"))))
            res        <- test(db, sess)
          yield res
        }
    }.unsafeToFuture()(IORuntime.global)
}
