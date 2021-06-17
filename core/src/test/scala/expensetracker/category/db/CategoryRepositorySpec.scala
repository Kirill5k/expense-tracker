package expensetracker.category.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryName}
import expensetracker.auth.account.AccountId
import mongo4cats.client.MongoClientF
import mongo4cats.database.MongoDatabaseF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

class CategoryRepositorySpec extends AnyWordSpec with Matchers with EmbeddedMongo {

  val acc1Id = AccountId(new ObjectId().toHexString)
  val acc2Id = AccountId(new ObjectId().toHexString)
  val cat1Id = CategoryId(new ObjectId().toHexString)
  val cat2Id = CategoryId(new ObjectId().toHexString)

  "A CategoryRepository" when {

    "getAll" should {
      "return all account's categories" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- CategoryRepository.make(client)
            cats <- repo.getAll(acc2Id)
          } yield cats

          result.map { cats =>
            cats must have size 1
            cats.head.id mustBe cat2Id
            cats.head.name mustBe CategoryName("c2")
            cats.head.accountId mustBe Some(acc2Id)
          }
        }
      }
    }

    "delete" should {
      "remove account's category" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- CategoryRepository.make(client)
            _    <- repo.delete(acc2Id, cat2Id)
            cats <- repo.getAll(acc2Id)
          } yield cats

          result.map { cats =>
            cats must have size 0
          }
        }
      }

      "keep category if accountId doesn't match" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- CategoryRepository.make(client)
            _    <- repo.delete(acc1Id, cat2Id)
            cats <- repo.getAll(acc2Id)
          } yield cats

          result.map { cats =>
            cats must have size 1
          }
        }
      }
    }

    "update" should {
      "update existing category" in {
        withEmbeddedMongoDb { db =>
          val result = for {
            repo <- CategoryRepository.make(db)
            _    <- repo.update(Category(cat2Id, CategoryName("c2-upd"), CategoryIcon("icon-upd"), Some(acc2Id)))
            cats <- repo.getAll(acc2Id)
          } yield cats

          result.map { cats =>
            cats must have size 1
          }
        }
      }
    }
  }

  def withEmbeddedMongoDb[A](test: MongoDatabaseF[IO] => IO[A]): A =
    withRunningEmbeddedMongo(port = 12347) {
      MongoClientF
        .fromConnectionString[IO]("mongodb://localhost:12347")
        .use { client =>
          for {
            db         <- client.getDatabase("expense-tracker")
            categories <- db.getCollection("categories")
            _ <- categories.insertMany[IO](List(categoryDoc(cat1Id, "c1"), categoryDoc(cat2Id, "c2", Some(acc2Id))))
            accounts <- db.getCollection("accounts")
            _        <- accounts.insertMany[IO](List(accDoc(acc1Id, "acc1"), accDoc(acc2Id, "acc2")))
            res      <- test(db)
          } yield res
        }
        .unsafeRunSync()
    }
}
