package expensetracker.auth.account.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.auth.account.{Account, AccountEmail, AccountId, PasswordHash}
import expensetracker.common.errors.AppError.{AccountAlreadyExists}
import mongo4cats.client.MongoClientF
import mongo4cats.database.MongoDatabaseF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

class AccountRepositorySpec extends AnyWordSpec with Matchers with EmbeddedMongo {

  val acc1Id = AccountId(new ObjectId().toHexString)

  "An AccountRepository" when {

    "find" should {
      "return account by email" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- AccountRepository.make(client)
            acc  <- repo.find(AccountEmail("acc1@et.com"))
          } yield acc

          result.map { acc =>
            acc mustBe Some(Account(acc1Id, AccountEmail("acc1@et.com"), PasswordHash("password")))
          }
        }
      }

      "return empty option when account does not exist" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- AccountRepository.make(client)
            acc  <- repo.find(AccountEmail("acc2@et.com"))
          } yield acc

          result.map { res =>
            res mustBe None
          }
        }
      }
    }

    "create" should {
      "create new account" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- AccountRepository.make(client)
            _    <- repo.create(AccountEmail("acc2@et.com"), PasswordHash("123456"))
            acc  <- repo.find(AccountEmail("acc2@et.com"))
          } yield acc

          result.map { acc =>
            acc.map(_.email) mustBe Some(AccountEmail("acc2@et.com"))
          }
        }
      }

      "return error when account already exists" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- AccountRepository.make(client)
            _    <- repo.create(AccountEmail("acc1@et.com"), PasswordHash("123456"))
          } yield ()

          result.attempt.map { err =>
            err mustBe Left(AccountAlreadyExists(AccountEmail("acc1@et.com")))
          }
        }
      }
    }
  }

  def withEmbeddedMongoDb[A](test: MongoDatabaseF[IO] => IO[A]): A =
    withRunningEmbeddedMongo(port = 12348) {
      MongoClientF
        .fromConnectionString[IO]("mongodb://localhost:12348")
        .use { client =>
          for {
            db   <- client.getDatabase("expense-tracker")
            accs <- db.getCollection("accounts")
            _    <- accs.insertMany[IO](List(accDoc(acc1Id, "acc1@et.com")))
            res  <- test(db)
          } yield res
        }
        .unsafeRunSync()
    }
}
