package expensetracker.auth.user.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.auth.user.{PasswordHash, User, UserDetails, UserEmail, UserId, UserName, UserSettings}
import expensetracker.common.errors.AppError.{AccountAlreadyExists, AccountDoesNotExist}
import mongo4cats.client.MongoClientF
import mongo4cats.database.MongoDatabaseF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec
import squants.market.USD

import java.time.Instant
import scala.concurrent.Future

class UserRepositorySpec extends AsyncWordSpec with Matchers with EmbeddedMongo {

  override protected val mongoPort: Int = 12346

  val regDate    = Instant.parse("2021-06-01T00:00:00Z")
  val acc1Id     = UserId(new ObjectId().toHexString)
  val acc2Id     = UserId(new ObjectId().toHexString)
  val hash       = PasswordHash("hash")
  val accDetails = UserDetails(UserEmail("acc1@et.com"), UserName("John", "Bloggs"))

  "An UserRepository" when {

    "find" should {
      "find account by id" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- UserRepository.make(client)
            acc  <- repo.find(acc1Id)
          } yield acc

          result.map { acc =>
            acc mustBe User(acc1Id, accDetails.email, accDetails.name, hash, UserSettings.Default, regDate)
          }
        }
      }

      "return error account does not exist" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- UserRepository.make(client)
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
            repo <- UserRepository.make(client)
            acc  <- repo.findBy(accDetails.email)
          } yield acc

          result.map { acc =>
            acc mustBe Some(User(acc1Id, accDetails.email, accDetails.name, hash, UserSettings.Default, regDate))
          }
        }
      }

      "return empty option when account does not exist" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- UserRepository.make(client)
            acc  <- repo.findBy(UserEmail("acc2@et.com"))
          } yield acc

          result.map { res =>
            res mustBe None
          }
        }
      }
    }

    "updateSettings" should {
      "update account settings" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- UserRepository.make(client)
            _    <- repo.updateSettings(acc1Id, UserSettings(USD, false, None))
            acc  <- repo.find(acc1Id)
          } yield acc

          result.map { acc =>
            acc.settings mustBe UserSettings(USD, false, None)
          }
        }
      }

      "return error when account does not exist" in {
        withEmbeddedMongoDb { client =>
          val id = UserId(new ObjectId().toHexString)
          val result = for {
            repo <- UserRepository.make(client)
            acc  <- repo.updateSettings(id, UserSettings.Default)
          } yield acc

          result.attempt.map { res =>
            res mustBe Left(AccountDoesNotExist(id))
          }
        }
      }
    }

    "updatePassword" should {
      "update account password" in {
        withEmbeddedMongoDb { client =>
          val newpwd = PasswordHash("new-password")
          val result = for {
            repo <- UserRepository.make(client)
            _    <- repo.updatePassword(acc1Id)(newpwd)
            acc  <- repo.find(acc1Id)
          } yield acc

          result.map { acc =>
            acc.password mustBe newpwd
          }
        }
      }

      "return error when account does not exist" in {
        withEmbeddedMongoDb { client =>
          val id = UserId(new ObjectId().toHexString)
          val result = for {
            repo <- UserRepository.make(client)
            acc  <- repo.updatePassword(id)(hash)
          } yield acc

          result.attempt.map { res =>
            res mustBe Left(AccountDoesNotExist(id))
          }
        }
      }
    }

    "create" should {
      "create new account" in {
        withEmbeddedMongoDb { client =>
          val email = UserEmail("acc2@et.com")

          val result = for {
            repo <- UserRepository.make(client)
            aid  <- repo.create(accDetails.copy(email = email), hash)
            acc  <- repo.findBy(email)
          } yield (aid, acc)

          result.map {
            case (aid, Some(acc)) =>
              acc mustBe User(aid, email, accDetails.name, hash, UserSettings.Default, acc.registrationDate)
            case _ => fail("unmatched case")
          }
        }
      }

      "return error when account already exists" in {
        withEmbeddedMongoDb { client =>
          val result = for {
            repo <- UserRepository.make(client)
            _    <- repo.create(accDetails, hash)
          } yield ()

          result.attempt.map { err =>
            err mustBe Left(AccountAlreadyExists(accDetails.email))
          }
        }
      }
    }
  }

  def withEmbeddedMongoDb[A](test: MongoDatabaseF[IO] => IO[A]): Future[A] =
    withRunningEmbeddedMongo {
      MongoClientF
        .fromConnectionString[IO](s"mongodb://$mongoHost:$mongoPort")
        .use { client =>
          for {
            db   <- client.getDatabase("expense-tracker")
            accs <- db.getCollection("users")
            _    <- accs.insertMany[IO](List(accDoc(acc1Id, "acc1@et.com", password = hash.value)))
            res  <- test(db)
          } yield res
        }
    }.unsafeToFuture()
}
