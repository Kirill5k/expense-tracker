package expensetracker.category.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryName}
import expensetracker.transaction.db.TransactionRepository
import expensetracker.transaction.{CreateTransaction, TransactionKind}
import expensetracker.user.UserId
import mongo4cats.client.MongoClientF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec
import squants.market.GBP

import java.time.Instant

class CategoryRepositorySpec extends AnyWordSpec with Matchers with EmbeddedMongo {

  val user1Id = UserId(new ObjectId().toHexString)
  val user2Id = UserId(new ObjectId().toHexString)
  val cat1Id  = CategoryId(new ObjectId().toHexString)
  val cat2Id  = CategoryId(new ObjectId().toHexString)

  "A CategoryRepository" should {
    "return all user's categories" in {
      withEmbeddedMongoClient { client =>
        val result = for {
          repo <- CategoryRepository.make(client)
          cats <- repo.getAll(user2Id)
        } yield cats

        result.map { cats =>
          cats must have size 1
          cats.head.name mustBe CategoryName("c2")
          cats.head.userId mustBe user2Id
        }
      }
    }
  }

  def withEmbeddedMongoClient[A](test: MongoClientF[IO] => IO[A]): A =
    withRunningEmbeddedMongo(port = 12347) {
      MongoClientF
        .fromConnectionString[IO]("mongodb://localhost:12347")
        .use { client =>
          for {
            db         <- client.getDatabase("expense-tracker")
            categories <- db.getCollection("categories")
            _ <- categories.insertMany[IO](List(categoryDoc(cat1Id, "c-1"), categoryDoc(cat2Id, "c-2", Some(user2Id))))
            users <- db.getCollection("users")
            _     <- users.insertMany[IO](List(userDoc(user1Id, "user-1"), userDoc(user2Id, "user-2")))
            res   <- test(client)
          } yield res
        }
        .unsafeRunSync()
    }
}
