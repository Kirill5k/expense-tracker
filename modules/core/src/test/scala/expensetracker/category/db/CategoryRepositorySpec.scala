package expensetracker.category.db

import cats.effect.IO
import cats.effect.unsafe.IORuntime
import expensetracker.MongoOps
import expensetracker.auth.user.{UserEmail, UserId}
import expensetracker.category.*
import expensetracker.common.errors.AppError.{CategoryAlreadyExists, CategoryDoesNotExist}
import expensetracker.fixtures.{Categories, Users}
import mongo4cats.bson.ObjectId
import mongo4cats.client.MongoClient
import mongo4cats.database.MongoDatabase
import mongo4cats.embedded.EmbeddedMongo
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec

import scala.concurrent.Future

class CategoryRepositorySpec extends AsyncWordSpec with Matchers with EmbeddedMongo with MongoOps {

  override protected val mongoPort: Int = 12348

  "A CategoryRepository" when {

    "create" should {
      "create new category in db" in {
        withEmbeddedMongoDb { client =>
          val create = Categories.create()
          val result = for
            repo   <- CategoryRepository.make(client)
            newCat <- repo.create(create)
            cat    <- repo.get(Users.uid1, newCat.id)
          yield cat

          result.map { cat =>
            cat.name mustBe create.name
            cat.icon mustBe create.icon
            cat.userId mustBe Some(Users.uid1)
            cat.kind mustBe create.kind
          }
        }
      }

      "return error if cat with such name already exists" in {
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- CategoryRepository.make(client)
            _    <- repo.create(Categories.create(name = CategoryName("C2"), uid = Users.uid2))
          yield ()

          result.attempt.map(_ mustBe Left(CategoryAlreadyExists(CategoryName("C2"))))
        }
      }
    }

    "get" should {
      "return error when cat id and acc id do not match" in {
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- CategoryRepository.make(client)
            cat  <- repo.get(Users.uid1, Categories.cid2)
          yield cat

          result.attempt.map(_ mustBe Left(CategoryDoesNotExist(Categories.cid2)))
        }
      }
    }

    "isHidden" should {
      "return hidden status of hidden cat" in {
        withEmbeddedMongoDb { client =>
          for
            repo     <- CategoryRepository.make(client)
            _        <- repo.hide(Users.uid2, Categories.cid2)
            isHidden <- repo.isHidden(Users.uid2, Categories.cid2)
          yield isHidden mustBe true
        }
      }

      "return hidden status of displayed cat" in {
        withEmbeddedMongoDb { client =>
          for
            repo     <- CategoryRepository.make(client)
            isHidden <- repo.isHidden(Users.uid2, Categories.cid2)
          yield isHidden mustBe false
        }
      }
    }

    "hide" should {
      "update hidden field of a cat" in {
        withEmbeddedMongoDb { client =>
          for
            repo <- CategoryRepository.make(client)
            _    <- repo.hide(Users.uid2, Categories.cid2)
            cats <- repo.getAll(Users.uid2)
          yield cats mustBe Nil
        }
      }

      "return error when cat does not exist" in {
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- CategoryRepository.make(client)
            res  <- repo.hide(Users.uid1, Categories.cid2)
          yield res

          result.attempt.map(_ mustBe Left(CategoryDoesNotExist(Categories.cid2)))
        }
      }
    }

    "getAll" should {
      "return all account's categories" in {
        withEmbeddedMongoDb { client =>
          for
            repo <- CategoryRepository.make(client)
            cats <- repo.getAll(Users.uid2)
          yield {
            cats must have size 1
            cats.head.id mustBe Categories.cid2
            cats.head.name mustBe CategoryName("c2")
            cats.head.userId mustBe Some(Users.uid2)
          }
        }
      }
    }

    "assignDefaults" should {
      "copy default categories with a new account id" in {
        withEmbeddedMongoDb { client =>
          for
            repo <- CategoryRepository.make(client)
            _    <- repo.assignDefault(Users.uid2)
            cats <- repo.getAll(Users.uid2)
          yield {
            cats.map(_.name) mustBe List(CategoryName("c1"), CategoryName("c2"))
            cats.flatMap(_.userId) mustBe List(Users.uid2, Users.uid2)
          }
        }
      }
    }

    "delete" should {
      "remove user's category" in {
        withEmbeddedMongoDb { client =>
          for
            repo <- CategoryRepository.make(client)
            _    <- repo.delete(Users.uid2, Categories.cid2)
            cats <- repo.getAll(Users.uid2)
          yield cats mustBe Nil
        }
      }

      "return error if userId doesn't match" in {
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- CategoryRepository.make(client)
            res  <- repo.delete(Users.uid1, Categories.cid2)
          yield res

          result.attempt.map(_ mustBe Left(CategoryDoesNotExist(Categories.cid2)))
        }
      }
    }

    "update" should {
      "update existing category" in {
        withEmbeddedMongoDb { db =>
          val update = Categories.cat(id = Categories.cid2, name = CategoryName("c2-upd"), uid = Some(Users.uid2))
          for
            repo <- CategoryRepository.make(db)
            _    <- repo.update(update)
            cats <- repo.getAll(Users.uid2)
          yield cats.map(_.copy(lastUpdatedAt = None)) mustBe List(update)
        }
      }

      "return error when category does not exist" in {
        withEmbeddedMongoDb { db =>
          val result = for
            repo <- CategoryRepository.make(db)
            res  <- repo.update(Categories.cat(id = Categories.cid, name = CategoryName("c2-upd")))
          yield res

          result.attempt.map(_ mustBe Left(CategoryDoesNotExist(Categories.cid)))
        }
      }
    }

    "save" should {
      "insert data into db if it doesn't exist" in {
        withEmbeddedMongoDb { db =>
          val newCat = Categories.cat(id = CategoryId(ObjectId().toHexString), name = CategoryName("cx"), uid = Some(Users.uid1))
          for
            repo <- CategoryRepository.make(db)
            _    <- repo.save(List(newCat))
            cat  <- repo.get(Users.uid1, newCat.id)
          yield cat.copy(lastUpdatedAt = None, createdAt = None) mustBe newCat
        }
      }

      "update existing data" in {
        withEmbeddedMongoDb { db =>
          val updatedCat = Categories.cat(id = Categories.cid2, name = CategoryName("cx"), uid = Some(Users.uid2))
          for
            repo <- CategoryRepository.make(db)
            _    <- repo.save(List(updatedCat))
            cat  <- repo.get(Users.uid2, updatedCat.id)
          yield cat.copy(lastUpdatedAt = None, createdAt = None) mustBe updatedCat
        }
      }
    }
  }

  def withEmbeddedMongoDb[A](test: MongoDatabase[IO] => IO[A]): Future[A] =
    withRunningEmbeddedMongo[IO, A] {
      MongoClient
        .fromConnectionString[IO](s"mongodb://localhost:$mongoPort")
        .use { client =>
          for
            db         <- client.getDatabase("expense-tracker")
            categories <- db.getCollection("categories")
            _        <- categories.insertMany(List(categoryDoc(Categories.cid, "c1"), categoryDoc(Categories.cid2, "c2", Some(Users.uid2))))
            accounts <- db.getCollection("users")
            _        <- accounts.insertMany(List(userDoc(Users.uid1, UserEmail("acc1")), userDoc(Users.uid2, UserEmail("acc2"))))
            res      <- test(db)
          yield res
        }
    }.unsafeToFuture()(IORuntime.global)
}
