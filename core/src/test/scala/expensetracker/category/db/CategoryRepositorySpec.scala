package expensetracker.category.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.category.{
  Category,
  CategoryColor,
  CategoryIcon,
  CategoryId,
  CategoryKind,
  CategoryName,
  CreateCategory
}
import expensetracker.auth.user.UserId
import expensetracker.common.errors.AppError.{CategoryAlreadyExists, CategoryDoesNotExist}
import mongo4cats.client.MongoClientF
import mongo4cats.database.MongoDatabaseF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

class CategoryRepositorySpec extends AnyWordSpec with Matchers with EmbeddedMongo {

  override protected val mongoPort: Int = 12348

  val acc1Id = UserId(new ObjectId().toHexString)
  val acc2Id = UserId(new ObjectId().toHexString)
  val cat1Id = CategoryId(new ObjectId().toHexString)
  val cat2Id = CategoryId(new ObjectId().toHexString)

  "A CategoryRepository" when {

    "create" should {
      "create new category in db" in {
        withEmbeddedMongoDb { client =>
          val create = CreateCategory(
            CategoryKind.Income,
            CategoryName("c2i"),
            CategoryIcon("icon"),
            CategoryColor.Blue,
            acc1Id
          )
          val result = for {
            repo <- CategoryRepository.make(client)
            id   <- repo.create(create)
            cat  <- repo.get(acc1Id, id)
          } yield cat

          result.map { cat =>
            cat.name mustBe create.name
            cat.icon mustBe create.icon
            cat.userId mustBe Some(acc1Id)
            cat.kind mustBe create.kind
          }
        }
      }

      "return error if cat with such name already exists" in {
        withEmbeddedMongoDb { client =>
          val create = CreateCategory(
            CategoryKind.Income,
            CategoryName("C2"),
            CategoryIcon("icon"),
            CategoryColor.Blue,
            acc2Id
          )
          val result = for {
            repo <- CategoryRepository.make(client)
            id   <- repo.create(create)
          } yield id

          result.attempt.map { err =>
            err mustBe Left(CategoryAlreadyExists(CategoryName("C2")))
          }
        }
      }
    }

    "get" should {
      "return error when cat id and acc id do not match" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- CategoryRepository.make(client)
            cat  <- repo.get(acc1Id, cat2Id)
          } yield cat

          result.attempt.map { res =>
            res mustBe Left(CategoryDoesNotExist(cat2Id))
          }
        }
      }
    }

    "isHidden" should {
      "return hidden status of hidden cat" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- CategoryRepository.make(client)
            _    <- repo.hide(acc2Id, cat2Id)
            isHidden <- repo.isHidden(acc2Id, cat2Id)
          } yield isHidden

          result.map { res =>
            res mustBe true
          }
        }
      }

      "return hidden status of displayed cat" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- CategoryRepository.make(client)
            isHidden <- repo.isHidden(acc2Id, cat2Id)
          } yield isHidden

          result.map { res =>
            res mustBe false
          }
        }
      }
    }

    "hide" should {
      "update hidden field of a cat" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- CategoryRepository.make(client)
            _    <- repo.hide(acc2Id, cat2Id)
            cats <- repo.getAll(acc2Id)
          } yield cats

          result.map { res =>
            res mustBe Nil
          }
        }
      }

      "return error when cat does not exist" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- CategoryRepository.make(client)
            res  <- repo.hide(acc1Id, cat2Id)
          } yield res

          result.attempt.map { res =>
            res mustBe Left(CategoryDoesNotExist(cat2Id))
          }
        }
      }
    }

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
            cats.head.userId mustBe Some(acc2Id)
          }
        }
      }
    }

    "assignDefaults" should {
      "copy default categories with a new account id" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- CategoryRepository.make(client)
            _    <- repo.assignDefault(acc2Id)
            cats <- repo.getAll(acc2Id)
          } yield cats

          result.map { cats =>
            cats must have size 2
            cats.map(_.name) mustBe List(CategoryName("c1"), CategoryName("c2"))
            cats.flatMap(_.userId) mustBe List(acc2Id, acc2Id)
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

      "return error if userId doesn't match" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- CategoryRepository.make(client)
            res  <- repo.delete(acc1Id, cat2Id)
          } yield res

          result.attempt.map { res =>
            res mustBe Left(CategoryDoesNotExist(cat2Id))
          }
        }
      }
    }

    "update" should {
      "update existing category" in {
        withEmbeddedMongoDb { db =>
          val update = Category(
            cat2Id,
            CategoryKind.Income,
            CategoryName("c2-upd"),
            CategoryIcon("icon-upd"),
            CategoryColor.Blue,
            Some(acc2Id)
          )
          val result = for {
            repo <- CategoryRepository.make(db)
            _    <- repo.update(update)
            cats <- repo.getAll(acc2Id)
          } yield cats

          result.map { cats =>
            cats must have size 1
            cats.head mustBe update
          }
        }
      }

      "return error when category does not exist" in {
        withEmbeddedMongoDb { db =>
          val update = Category(
            cat1Id,
            CategoryKind.Expense,
            CategoryName("c2-upd"),
            CategoryIcon("icon-upd"),
            CategoryColor.Blue,
            Some(acc2Id)
          )
          val result = for {
            repo <- CategoryRepository.make(db)
            res  <- repo.update(update)
          } yield res

          result.attempt.map { res =>
            res mustBe Left(CategoryDoesNotExist(cat1Id))
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
            _ <- categories.insertMany[IO](List(categoryDoc(cat1Id, "c1"), categoryDoc(cat2Id, "c2", Some(acc2Id))))
            accounts <- db.getCollection("accounts")
            _        <- accounts.insertMany[IO](List(accDoc(acc1Id, "acc1"), accDoc(acc2Id, "acc2")))
            res      <- test(db)
          } yield res
        }
        .unsafeRunSync()
    }
}
