package expensetracker.auth.user.db

import cats.effect.IO
import cats.effect.unsafe.IORuntime
import de.flapdoodle.embed.mongo.distribution.Version
import expensetracker.MongoOps
import expensetracker.auth.user.{PasswordHash, User, UserEmail, UserId, UserSettings}
import expensetracker.category.CategoryName
import expensetracker.common.errors.AppError.{UserAlreadyExists, UserDoesNotExist}
import expensetracker.fixtures.{Categories, Transactions, Users}
import expensetracker.transaction.TransactionId
import mongo4cats.bson.ObjectId
import mongo4cats.client.MongoClient
import mongo4cats.database.MongoDatabase
import mongo4cats.embedded.EmbeddedMongo
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec
import squants.market.{GBP, USD}

import scala.concurrent.Future

class UserRepositorySpec extends AsyncWordSpec with Matchers with EmbeddedMongo with MongoOps {

  override protected val mongoPort: Int        = 12346
  override protected val mongoVersion: Version = Version.V7_0_2

  "An UserRepository" when {

    "find" should {
      "return error account does not exist" in {
        withEmbeddedMongoDb { db =>
          val result = for
            repo <- UserRepository.make(db)
            acc  <- repo.find(Users.uid2)
          yield acc

          result.attempt.map(_ mustBe Left(UserDoesNotExist(Users.uid2)))
        }
      }

      "find account by id with its categories" in {
        withEmbeddedMongoDb { db =>
          val result = for
            repo <- UserRepository.make(db)
            acc  <- repo.find(Users.uid1)
          yield acc

          result.map { acc =>
            acc.id mustBe Users.uid1
            acc.categories mustBe defined
            acc.categories.get must have size 1
            acc.categories.get.head.name mustBe CategoryName("category-1")
            acc.totalTransactionCount mustBe Some(2)
          }
        }
      }
    }

    "findBy" should {
      "find account by email" in {
        withEmbeddedMongoDb { db =>
          val result = for
            repo <- UserRepository.make(db)
            acc  <- repo.findBy(Users.details.email)
          yield acc

          result.map { acc =>
            acc mustBe Some(User(Users.uid1, Users.details.email, Users.details.name, Users.hash, UserSettings.Default, Users.regDate))
          }
        }
      }

      "return empty option when account does not exist" in {
        withEmbeddedMongoDb { db =>
          val result = for
            repo <- UserRepository.make(db)
            acc  <- repo.findBy(UserEmail("acc2@et.com"))
          yield acc

          result.map(_ mustBe None)
        }
      }
    }

    "updateSettings" should {
      "update account settings" in {
        withEmbeddedMongoDb { db =>
          val result = for
            repo <- UserRepository.make(db)
            _    <- repo.updateSettings(Users.uid1, UserSettings(USD, false, None, Some(7)))
            acc  <- repo.find(Users.uid1)
          yield acc

          result.map { acc =>
            acc.settings mustBe UserSettings(USD, false, None, Some(7))
          }
        }
      }

      "return error when account does not exist" in {
        withEmbeddedMongoDb { db =>
          val id = UserId(ObjectId().toHexString)
          val result = for
            repo <- UserRepository.make(db)
            acc  <- repo.updateSettings(id, UserSettings.Default)
          yield acc

          result.attempt.map(_ mustBe Left(UserDoesNotExist(id)))
        }
      }
    }

    "updatePassword" should {
      "update account password" in {
        withEmbeddedMongoDb { db =>
          val newpwd = PasswordHash("new-password")
          val result = for
            repo <- UserRepository.make(db)
            _    <- repo.updatePassword(Users.uid1)(newpwd)
            acc  <- repo.find(Users.uid1)
          yield acc

          result.map { acc =>
            acc.password mustBe newpwd
          }
        }
      }

      "return error when account does not exist" in {
        withEmbeddedMongoDb { db =>
          val id = UserId(ObjectId().toHexString)
          val result = for
            repo <- UserRepository.make(db)
            acc  <- repo.updatePassword(id)(Users.hash)
          yield acc

          result.attempt.map(_ mustBe Left(UserDoesNotExist(id)))
        }
      }
    }

    "create" should {
      "create new account" in {
        withEmbeddedMongoDb { db =>
          val email = UserEmail("acc2@et.com")

          val result = for
            repo <- UserRepository.make(db)
            aid  <- repo.create(Users.details.copy(email = email), Users.hash)
            acc  <- repo.findBy(email)
          yield (aid, acc)

          result.map {
            case (aid, Some(acc)) =>
              acc mustBe User(aid, email, Users.details.name, Users.hash, UserSettings.Default, acc.registrationDate)
            case _ => fail("unmatched case")
          }
        }
      }

      "return error when account already exists" in {
        withEmbeddedMongoDb { db =>
          val result = for
            repo <- UserRepository.make(db)
            _    <- repo.create(Users.details, Users.hash)
          yield ()

          result.attempt.map(_ mustBe Left(UserAlreadyExists(Users.details.email)))
        }
      }
    }
  }

  def withEmbeddedMongoDb[A](test: MongoDatabase[IO] => IO[A]): Future[A] =
    withRunningEmbeddedMongo {
      MongoClient
        .fromConnectionString[IO](s"mongodb://localhost:$mongoPort")
        .use { client =>
          for
            db         <- client.getDatabase("expense-tracker")
            categories <- db.getCollection("categories")
            _ <- categories.insertMany(
              List(
                categoryDoc(Categories.cid, "category-1", Some(Users.uid1)),
                categoryDoc(Categories.cid2, "category-2", Some(Users.uid1), Some(true))
              )
            )
            transactions <- db.getCollection("transactions")
            _ <- transactions.insertMany(
              List(
                transactionDoc(Transactions.txid, Categories.cid, Users.uid1, GBP(15.0), Transactions.txdate),
                transactionDoc(TransactionId(ObjectId().toHexString), Categories.cid2, Users.uid1, GBP(15.0), Transactions.txdate)
              )
            )
            users <- db.getCollection("users")
            _     <- users.insertOne(userDoc(Users.uid1, Users.details.email, password = Users.hash, registrationDate = Users.regDate))
            res   <- test(db)
          yield res
        }
    }.unsafeToFuture()(IORuntime.global)
}
