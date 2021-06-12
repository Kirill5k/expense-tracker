package expensetracker.transaction.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryName}
import expensetracker.transaction.{CreateTransaction, TransactionKind}
import expensetracker.transaction.TransactionKind.Expense
import expensetracker.auth.user.UserId
import mongo4cats.client.MongoClientF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec
import squants.market.GBP

import java.time.Instant

class TransactionRepositorySpec extends AnyWordSpec with EmbeddedMongo with Matchers {

  val user1Id = UserId(new ObjectId().toHexString)
  val user2Id = UserId(new ObjectId().toHexString)
  val cat1Id  = CategoryId(new ObjectId().toHexString)
  val cat2Id  = CategoryId(new ObjectId().toHexString)

  "A TransactionRepository" should {

    "create new transactions" in {
      withEmbeddedMongoClient { client =>
        val result = for {
          repo <- TransactionRepository.make(client)
          res  <- repo.create(CreateTransaction(user1Id, Expense, cat1Id, GBP(15.0), Instant.now(), None))
        } yield res

        result.attempt.map(_ mustBe Right(()))
      }
    }

    "return existing transactions from db" in {
      withEmbeddedMongoClient { client =>
        val result = for {
          repo <- TransactionRepository.make(client)
          _ <- repo.create(CreateTransaction(user1Id, TransactionKind.Expense, cat1Id, GBP(15.0), Instant.now(), None))
          _ <- repo.create(CreateTransaction(user1Id, TransactionKind.Income, cat2Id, GBP(45.0), Instant.now(), None))
          txs <- repo.getAll(user1Id)
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

    "not return transactions that belong to other users" in {
      withEmbeddedMongoClient { client =>
        val result = for {
          repo <- TransactionRepository.make(client)
          _ <- repo.create(CreateTransaction(user1Id, TransactionKind.Expense, cat1Id, GBP(15.0), Instant.now(), None))
          _ <- repo.create(CreateTransaction(user1Id, TransactionKind.Expense, cat2Id, GBP(45.0), Instant.now(), None))
          txs <- repo.getAll(user2Id)
        } yield txs

        result.map { txs =>
          txs must have size 0
        }
      }
    }
  }

  def withEmbeddedMongoClient[A](test: MongoClientF[IO] => IO[A]): A =
    withRunningEmbeddedMongo(port = 12346) {
      MongoClientF
        .fromConnectionString[IO]("mongodb://localhost:12346")
        .use { client =>
          for {
            db         <- client.getDatabase("expense-tracker")
            categories <- db.getCollection("categories")
            _ <- categories.insertMany[IO](List(categoryDoc(cat1Id, "category-1"), categoryDoc(cat2Id, "category-2")))
            users <- db.getCollection("users")
            _     <- users.insertMany[IO](List(userDoc(user1Id, "user-1"), userDoc(user2Id, "user-2")))
            res   <- test(client)
          } yield res
        }
        .unsafeRunSync()
    }
}
