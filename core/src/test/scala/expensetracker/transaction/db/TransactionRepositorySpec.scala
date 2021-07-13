package expensetracker.transaction.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId, TransactionKind}
import mongo4cats.client.MongoClientF
import mongo4cats.database.MongoDatabaseF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec
import squants.market.GBP

import java.time.LocalDate

class TransactionRepositorySpec extends AnyWordSpec with EmbeddedMongo with Matchers {

  override protected val mongoPort: Int = 12349

  val acc1Id = UserId(new ObjectId().toHexString)
  val acc2Id = UserId(new ObjectId().toHexString)
  val cat1Id = CategoryId(new ObjectId().toHexString)
  val cat2Id = CategoryId(new ObjectId().toHexString)

  "A TransactionRepository" should {

    val create = CreateTransaction(acc1Id, TransactionKind.Expense, cat1Id, GBP(15.0), LocalDate.now(), None)

    "create new transaction and return id" in {
      withEmbeddedMongoDb { client =>
        val result = for {
          repo <- TransactionRepository.make(client)
          txId <- repo.create(create)
          txs  <- repo.getAll(acc1Id)
        } yield (txId, txs)

        result.map { case (txId, txs) =>
          txs must have size 1
          val tx = txs.head
          tx.id mustBe txId
        }
      }
    }

    "return existing transactions from db" in {
      withEmbeddedMongoDb { client =>
        val result = for {
          repo <- TransactionRepository.make(client)
          _    <- repo.create(create)
          _ <- repo.create(CreateTransaction(acc1Id, TransactionKind.Income, cat2Id, GBP(45.0), LocalDate.now(), None))
          txs <- repo.getAll(acc1Id)
        } yield txs

        result.map { txs =>
          txs must have size 2
          txs.map(_.kind) mustBe List(TransactionKind.Expense, TransactionKind.Income)
          txs.map(_.amount) mustBe List(GBP(15.0), GBP(45.0))
          txs.map(_.categoryId) mustBe List(cat1Id, cat2Id)
        }
      }
    }

    "return tx by id from db" in {
      withEmbeddedMongoDb { client =>
        val result = for {
          repo <- TransactionRepository.make(client)
          id   <- repo.create(create)
          tx   <- repo.get(acc1Id, id)
        } yield tx

        result.map { tx =>
          tx.accountId mustBe acc1Id
        }
      }
    }

    "return error when tx does not exist" in {
      withEmbeddedMongoDb { client =>
        val result = for {
          repo <- TransactionRepository.make(client)
          id   <- repo.create(create)
          err  <- repo.get(acc2Id, id).attempt
        } yield (id, err)

        result.map { case (id, err) =>
          err mustBe Left(TransactionDoesNotExist(id))
        }
      }
    }

    "not return transactions that belong to other accounts" in {
      withEmbeddedMongoDb { client =>
        val result = for {
          repo <- TransactionRepository.make(client)
          _    <- repo.create(create)
          _    <- repo.create(create.copy(categoryId = cat2Id, amount = GBP(45.0)))
          txs  <- repo.getAll(acc2Id)
        } yield txs

        result.map { txs =>
          txs must have size 0
        }
      }
    }

    "delete" should {
      "remove account's transaction" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- TransactionRepository.make(client)
            txid <- repo.create(create)
            _    <- repo.delete(acc1Id, txid)
            cats <- repo.getAll(acc1Id)
          } yield cats

          result.map { txs =>
            txs must have size 0
          }
        }
      }

      "return error if accountId doesn't match" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- TransactionRepository.make(client)
            txid <- repo.create(create)
            res  <- repo.delete(acc2Id, txid).attempt
          } yield (txid, res)

          result.map { case (txid, res) =>
            res mustBe Left(TransactionDoesNotExist(txid))
          }
        }
      }
    }

    "update" should {
      "update existing tx" in {
        withEmbeddedMongoDb { db =>
          val result = for {
            repo <- TransactionRepository.make(db)
            txid <- repo.create(create)
            tx   <- repo.get(acc1Id, txid)
            _    <- repo.update(tx.copy(amount = GBP(25.0)))
            txs  <- repo.getAll(acc1Id)
          } yield (tx, txs)

          result.map { case (tx, txs) =>
            txs mustBe List(tx.copy(amount = GBP(25.0)))
          }
        }
      }

      "return error when tx does not exist" in {
        withEmbeddedMongoDb { db =>
          val txid = TransactionId(new ObjectId().toHexString)
          val result = for {
            repo <- TransactionRepository.make(db)
            res <- repo.update(
              Transaction(txid, acc1Id, TransactionKind.Expense, cat1Id, GBP(15.0), LocalDate.now(), None)
            )
          } yield res

          result.attempt.map { res =>
            res mustBe Left(TransactionDoesNotExist(txid))
          }
        }
      }
    }

    "hide" should {
      "update hidden field of a tx" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- TransactionRepository.make(client)
            txid <- repo.create(create)
            _    <- repo.hide(acc1Id, txid)
            txs  <- repo.getAll(acc1Id)
          } yield txs

          result.map { res =>
            res mustBe Nil
          }
        }
      }

      "return error when tx does not exist" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- TransactionRepository.make(client)
            txid <- repo.create(create)
            res  <- repo.hide(acc2Id, txid).attempt
          } yield (txid, res)

          result.map { case (txid, res) =>
            res mustBe Left(TransactionDoesNotExist(txid))
          }
        }
      }
    }

    "isHidden" should {
      "return status of a hidden tx" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- TransactionRepository.make(client)
            txid <- repo.create(create)
            _    <- repo.hide(acc1Id, txid)
            txs  <- repo.isHidden(acc1Id, txid)
          } yield txs

          result.map { res =>
            res mustBe true
          }
        }
      }

      "return status of a displayed tx" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- TransactionRepository.make(client)
            txid <- repo.create(create)
            txs  <- repo.isHidden(acc1Id, txid)
          } yield txs

          result.map { res =>
            res mustBe false
          }
        }
      }
    }
  }

  def withEmbeddedMongoDb[A](test: MongoDatabaseF[IO] => IO[A]): A =
    withRunningEmbeddedMongo {
      MongoClientF
        .fromConnectionString[IO](s"mongodb://$mongoHost:$mongoPort")
        .use { client =>
          for {
            db         <- client.getDatabase("expense-tracker")
            categories <- db.getCollection("categories")
            _ <- categories.insertMany[IO](List(categoryDoc(cat1Id, "category-1"), categoryDoc(cat2Id, "category-2")))
            accs <- db.getCollection("accounts")
            _    <- accs.insertMany[IO](List(accDoc(acc1Id, "acc-1"), accDoc(acc2Id, "acc-2")))
            res  <- test(db)
          } yield res
        }
        .unsafeRunSync()
    }
}
