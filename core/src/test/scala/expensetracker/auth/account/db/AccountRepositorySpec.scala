package expensetracker.auth.account.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.auth.account.{Account, AccountDetails, AccountEmail, AccountId, AccountName, AccountSettings, PasswordHash}
import expensetracker.common.errors.AppError.{AccountAlreadyExists, AccountDoesNotExist}
import mongo4cats.client.MongoClientF
import mongo4cats.database.MongoDatabaseF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

class AccountRepositorySpec extends AnyWordSpec with Matchers with EmbeddedMongo {

  override protected val mongoPort: Int = 12346

  val acc1Id = AccountId(new ObjectId().toHexString)
  val acc2Id = AccountId(new ObjectId().toHexString)
  val hash = PasswordHash("hash")
  val accDetails = AccountDetails(AccountEmail("acc1@et.com"), AccountName("John", "Bloggs"))

  "An AccountRepository" when {

    "find" should {
      "find account by id" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- AccountRepository.make(client)
            acc  <- repo.find(acc1Id)
          } yield acc

          result.map { acc =>
            acc mustBe Account(acc1Id, accDetails.email, accDetails.name, hash, AccountSettings.Default)
          }
        }
      }

      "return error account does not exist" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- AccountRepository.make(client)
            acc  <- repo.find(acc2Id)
          } yield acc

          result.attempt.map { res =>
            res mustBe Left(AccountDoesNotExist(acc2Id))
          }
        }
      }
    }

    "findBy" should {
      "find account by email" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- AccountRepository.make(client)
            acc  <- repo.findBy(accDetails.email)
          } yield acc

          result.map { acc =>
            acc mustBe Some(Account(acc1Id, accDetails.email, accDetails.name, hash, AccountSettings.Default))
          }
        }
      }

      "return empty option when account does not exist" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- AccountRepository.make(client)
            acc  <- repo.findBy(AccountEmail("acc2@et.com"))
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
          val email = AccountEmail("acc2@et.com")

          val result = for {
            repo <- AccountRepository.make(client)
            aid    <- repo.create(accDetails.copy(email = email), hash)
            acc  <- repo.findBy(email)
          } yield (aid, acc)

          result.map { case (aid, acc) =>
            acc mustBe Some(Account(aid, email, accDetails.name, hash, AccountSettings.Default))
          }
        }
      }

      "return error when account already exists" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- AccountRepository.make(client)
            _    <- repo.create(accDetails, hash)
          } yield ()

          result.attempt.map { err =>
            err mustBe Left(AccountAlreadyExists(accDetails.email))
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
            db   <- client.getDatabase("expense-tracker")
            accs <- db.getCollection("accounts")
            _    <- accs.insertMany[IO](List(accDoc(acc1Id, "acc1@et.com", password = hash.value)))
            res  <- test(db)
          } yield res
        }
        .unsafeRunSync()
    }
}
