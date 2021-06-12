package expensetracker.transaction.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryName}
import expensetracker.transaction.{CreateTransaction, TransactionKind}
import expensetracker.transaction.TransactionKind.Expense
import expensetracker.auth.account.AccountId
import mongo4cats.client.MongoClientF
import mongo4cats.database.MongoDatabaseF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec
import squants.market.GBP

import java.time.Instant

class TransactionRepositorySpec extends AnyWordSpec with EmbeddedMongo with Matchers {

  val acc1Id = AccountId(new ObjectId().toHexString)
  val acc2Id = AccountId(new ObjectId().toHexString)
  val cat1Id = CategoryId(new ObjectId().toHexString)
  val cat2Id = CategoryId(new ObjectId().toHexString)

  "A TransactionRepository" should {

    "create new transactions" in {
      withEmbeddedMongoDb { client =>
        val result = for {
          repo <- TransactionRepository.make(client)
          res  <- repo.create(CreateTransaction(acc1Id, Expense, cat1Id, GBP(15.0), Instant.now(), None))
        } yield res

        result.attempt.map(_ mustBe Right(()))
      }
    }

    "return existing transactions from db" in {
      withEmbeddedMongoDb { client =>
        val result = for {
          repo <- TransactionRepository.make(client)
          _   <- repo.create(CreateTransaction(acc1Id, TransactionKind.Expense, cat1Id, GBP(15.0), Instant.now(), None))
          _   <- repo.create(CreateTransaction(acc1Id, TransactionKind.Income, cat2Id, GBP(45.0), Instant.now(), None))
          txs <- repo.getAll(acc1Id)
        } yield txs

        result.map { txs =>
          txs must have size 2
          txs.map(_.kind) mustBe List(TransactionKind.Expense, TransactionKind.Income)
          txs.map(_.amount) mustBe List(GBP(15.0), GBP(45.0))
          txs.map(_.category) mustBe List(
            Category(cat1Id, CategoryName("category-1"), CategoryIcon("icon"), None),
            Category(cat2Id, CategoryName("category-2"), CategoryIcon("icon"), None)
          )
        }
      }
    }

    "not return transactions that belong to other accounts" in {
      withEmbeddedMongoDb { client =>
        val result = for {
          repo <- TransactionRepository.make(client)
          _   <- repo.create(CreateTransaction(acc1Id, TransactionKind.Expense, cat1Id, GBP(15.0), Instant.now(), None))
          _   <- repo.create(CreateTransaction(acc1Id, TransactionKind.Expense, cat2Id, GBP(45.0), Instant.now(), None))
          txs <- repo.getAll(acc2Id)
        } yield txs

        result.map { txs =>
          txs must have size 0
        }
      }
    }
  }

  def withEmbeddedMongoDb[A](test: MongoDatabaseF[IO] => IO[A]): A =
    withRunningEmbeddedMongo(port = 12346) {
      MongoClientF
        .fromConnectionString[IO]("mongodb://localhost:12346")
        .use { client =>
          for {
            db         <- client.getDatabase("expense-tracker")
            categories <- db.getCollection("categories")
            _ <- categories.insertMany[IO](List(categoryDoc(cat1Id, "category-1"), categoryDoc(cat2Id, "category-2")))
            accs <- db.getCollection("accounts")
            _     <- accs.insertMany[IO](List(accDoc(acc1Id, "acc-1"), accDoc(acc2Id, "acc-2")))
            res   <- test(db)
          } yield res
        }
        .unsafeRunSync()
    }
}
