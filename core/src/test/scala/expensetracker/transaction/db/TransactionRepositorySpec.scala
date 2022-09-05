package expensetracker.transaction.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.MongoOps
import expensetracker.auth.user.{UserEmail, UserId}
import expensetracker.category.CategoryId
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import expensetracker.fixtures.{Categories, Transactions, Users}
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId, TransactionKind}
import mongo4cats.bson.ObjectId
import mongo4cats.client.MongoClient
import mongo4cats.database.MongoDatabase
import mongo4cats.embedded.EmbeddedMongo
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec
import squants.market.GBP

import java.time.LocalDate
import scala.concurrent.Future

class TransactionRepositorySpec extends AsyncWordSpec with EmbeddedMongo with Matchers with MongoOps {

  override protected val mongoPort: Int = 12349

  "A TransactionRepository" should {

    "create new transaction and return id" in {
      withEmbeddedMongoDb { client =>
        val result = for
          repo <- TransactionRepository.make(client)
          txId <- repo.create(Transactions.create())
          txs  <- repo.getAll(Users.uid1)
        yield (txId, txs)

        result.map { case (txId, txs) =>
          txs must have size 1
          val tx = txs.head
          tx.id mustBe txId
        }
      }
    }

    "return existing transactions from db" in {
      withEmbeddedMongoDb { client =>
        val result = for
          repo <- TransactionRepository.make(client)
          _    <- repo.create(Transactions.create())
          _    <- repo.create(Transactions.create(catid = Categories.cid2, kind = TransactionKind.Income, amount = GBP(45.0)))
          txs  <- repo.getAll(Users.uid1)
        yield txs

        result.map { txs =>
          txs must have size 2
          txs.map(_.kind) mustBe List(TransactionKind.Expense, TransactionKind.Income)
          txs.map(_.amount) mustBe List(GBP(15.0), GBP(45.0))
          txs.map(_.categoryId) mustBe List(Categories.cid, Categories.cid2)
        }
      }
    }

    "return tx by id from db" in {
      withEmbeddedMongoDb { client =>
        val result = for
          repo <- TransactionRepository.make(client)
          id   <- repo.create(Transactions.create())
          tx   <- repo.get(Users.uid1, id)
        yield tx

        result.map { tx =>
          tx.userId mustBe Users.uid1
        }
      }
    }

    "return error when tx does not exist" in {
      withEmbeddedMongoDb { client =>
        val result = for
          repo <- TransactionRepository.make(client)
          id   <- repo.create(Transactions.create())
          err  <- repo.get(Users.uid2, id).attempt
        yield (id, err)

        result.map { case (id, err) =>
          err mustBe Left(TransactionDoesNotExist(id))
        }
      }
    }

    "not return transactions that belong to other accounts" in {
      withEmbeddedMongoDb { client =>
        val result = for
          repo <- TransactionRepository.make(client)
          _    <- repo.create(Transactions.create())
          _    <- repo.create(Transactions.create(catid = Categories.cid2, amount = GBP(45.0)))
          txs  <- repo.getAll(Users.uid2)
        yield txs

        result.map { txs =>
          txs must have size 0
        }
      }
    }

    "delete" should {
      "remove account's transaction" in {
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- TransactionRepository.make(client)
            txid <- repo.create(Transactions.create())
            _    <- repo.delete(Users.uid1, txid)
            cats <- repo.getAll(Users.uid1)
          yield cats

          result.map { txs =>
            txs must have size 0
          }
        }
      }

      "return error if userId doesn't match" in {
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- TransactionRepository.make(client)
            txid <- repo.create(Transactions.create())
            res  <- repo.delete(Users.uid2, txid).attempt
          yield (txid, res)

          result.map { case (txid, res) =>
            res mustBe Left(TransactionDoesNotExist(txid))
          }
        }
      }
    }

    "update" should {
      "update existing tx" in {
        withEmbeddedMongoDb { db =>
          val result = for
            repo <- TransactionRepository.make(db)
            txid <- repo.create(Transactions.create())
            tx   <- repo.get(Users.uid1, txid)
            _    <- repo.update(tx.copy(amount = GBP(25.0)))
            txs  <- repo.getAll(Users.uid1)
          yield (tx, txs)

          result.map { case (tx, txs) =>
            txs mustBe List(tx.copy(amount = GBP(25.0)))
          }
        }
      }

      "return error when tx does not exist" in {
        withEmbeddedMongoDb { db =>
          val result = for
            repo <- TransactionRepository.make(db)
            res  <- repo.update(Transactions.tx())
          yield res

          result.attempt.map { res =>
            res mustBe Left(TransactionDoesNotExist(Transactions.txid))
          }
        }
      }
    }

    "hide" should {
      "update hidden field of a tx" in {
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- TransactionRepository.make(client)
            txid <- repo.create(Transactions.create())
            _    <- repo.hide(Users.uid1, txid)
            txs  <- repo.getAll(Users.uid1)
          yield txs

          result.map { res =>
            res mustBe Nil
          }
        }
      }

      "return error when tx does not exist" in {
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- TransactionRepository.make(client)
            txid <- repo.create(Transactions.create())
            res  <- repo.hide(Users.uid2, txid).attempt
          yield (txid, res)

          result.map { case (txid, res) =>
            res mustBe Left(TransactionDoesNotExist(txid))
          }
        }
      }
    }

    "isHidden" should {
      "return status of a hidden tx" in {
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- TransactionRepository.make(client)
            txid <- repo.create(Transactions.create())
            _    <- repo.hide(Users.uid1, txid)
            txs  <- repo.isHidden(Users.uid1, txid)
          yield txs

          result.map { res =>
            res mustBe true
          }
        }
      }

      "return status of a displayed tx" in {
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- TransactionRepository.make(client)
            txid <- repo.create(Transactions.create())
            txs  <- repo.isHidden(Users.uid1, txid)
          yield txs

          result.map { res =>
            res mustBe false
          }
        }
      }
    }
  }

  def withEmbeddedMongoDb[A](test: MongoDatabase[IO] => IO[A]): Future[A] =
    withRunningEmbeddedMongo {
      MongoClient
        .fromConnectionString[IO](s"mongodb://$mongoHost:$mongoPort")
        .use { client =>
          for
            db         <- client.getDatabase("expense-tracker")
            categories <- db.getCollection("categories")
            _          <- categories.insertMany(List(categoryDoc(Categories.cid, "category-1"), categoryDoc(Categories.cid2, "category-2")))
            accs       <- db.getCollection("accounts")
            _          <- accs.insertMany(List(userDoc(Users.uid1, UserEmail("acc-1")), userDoc(Users.uid2, UserEmail("acc-2"))))
            res        <- test(db)
          yield res
        }
    }.unsafeToFuture()
}
