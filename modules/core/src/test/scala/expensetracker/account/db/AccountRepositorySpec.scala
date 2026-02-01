package expensetracker.account.db

import cats.effect.IO
import cats.effect.unsafe.IORuntime
import expensetracker.MongoOps
import expensetracker.account.{AccountId, AccountName}
import expensetracker.auth.user.UserEmail
import expensetracker.common.errors.AppError.{AccountAlreadyExists, AccountDoesNotExist}
import expensetracker.fixtures.Accounts
import expensetracker.fixtures.Users
import mongo4cats.bson.ObjectId
import mongo4cats.client.MongoClient
import mongo4cats.database.MongoDatabase
import mongo4cats.embedded.EmbeddedMongo
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec

import scala.concurrent.Future

class AccountRepositorySpec extends AsyncWordSpec with Matchers with EmbeddedMongo with MongoOps {

  override protected val mongoPort: Int = 12350

  "A AccountRepository" when {

    "create" should {
      "create new account in db" in
        withEmbeddedMongoDb { client =>
          val create = Accounts.create()
          for
            repo   <- AccountRepository.make(client)
            newAcc <- repo.create(create)
            accs   <- repo.getAll(Users.uid1)
          yield accs.map(_.id) must contain(newAcc.id)
        }

      "return error if acc with such name already exists" in
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- AccountRepository.make(client)
            _    <- repo.create(Accounts.create(name = AccountName("test-account"), uid = Users.uid1))
          yield ()

          result.attempt.map(_ mustBe Left(AccountAlreadyExists(AccountName("test-account"))))
        }
    }

    "hide" should {
      "update hidden field of an account" in
        withEmbeddedMongoDb { client =>
          for
            repo <- AccountRepository.make(client)
            _    <- repo.hide(Users.uid1, Accounts.id)
            cats <- repo.getAll(Users.uid1)
          yield cats mustBe Nil
        }

      "return error when cat does not exist" in
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- AccountRepository.make(client)
            res  <- repo.hide(Users.uid2, Accounts.id)
          yield res

          result.attempt.map(_ mustBe Left(AccountDoesNotExist(Accounts.id)))
        }
    }

    "delete" should {
      "remove user's account" in
        withEmbeddedMongoDb { client =>
          for
            repo <- AccountRepository.make(client)
            _    <- repo.delete(Users.uid1, Accounts.id)
            cats <- repo.getAll(Users.uid1)
          yield cats mustBe Nil
        }

      "return error if userId doesn't match" in
        withEmbeddedMongoDb { client =>
          val result = for
            repo <- AccountRepository.make(client)
            res  <- repo.delete(Users.uid2, Accounts.id)
          yield res

          result.attempt.map(_ mustBe Left(AccountDoesNotExist(Accounts.id)))
        }
    }

    "update" should {
      "update existing accounts" in
        withEmbeddedMongoDb { db =>
          val update = Accounts.acc(id = Accounts.id, name = AccountName("updated"), uid = Users.uid1)
          for
            repo <- AccountRepository.make(db)
            _    <- repo.update(update)
            accs <- repo.getAll(Users.uid1)
          yield accs.map(_.copy(lastUpdatedAt = None)) mustBe List(update)
        }

      "return error when account does not exist" in
        withEmbeddedMongoDb { db =>
          val result = for
            repo <- AccountRepository.make(db)
            res  <- repo.update(Accounts.acc(id = Accounts.id, name = AccountName("c2-upd"), uid = Users.uid2))
          yield res

          result.attempt.map(_ mustBe Left(AccountDoesNotExist(Accounts.id)))
        }
    }

    "save" should {
      "insert data into db if it doesn't exist" in
        withEmbeddedMongoDb { db =>
          val newAcc = Accounts.acc(id = AccountId(ObjectId()), name = AccountName("account"), uid = Users.uid2)
          for
            repo <- AccountRepository.make(db)
            _    <- repo.save(List(newAcc))
            accs <- repo.getAll(Users.uid2)
          yield accs.map(_.copy(lastUpdatedAt = None, createdAt = None)) mustBe List(newAcc)
        }

      "update existing data" in
        withEmbeddedMongoDb { db =>
          val updatedAcc = Accounts.acc(id = Accounts.id, name = AccountName("updated"), uid = Users.uid1)
          for
            repo <- AccountRepository.make(db)
            _    <- repo.save(List(updatedAcc))
            accs <- repo.getAll(Users.uid1)
          yield accs.map(_.copy(lastUpdatedAt = None, createdAt = None)) mustBe List(updatedAcc)
        }
    }
  }

  def withEmbeddedMongoDb[A](test: MongoDatabase[IO] => IO[A]): Future[A] =
    withRunningEmbeddedMongo[IO, A] {
      MongoClient
        .fromConnectionString[IO](s"mongodb://localhost:$mongoPort")
        .use { client =>
          for
            db       <- client.getDatabase("expense-tracker")
            accounts <- db.getCollection("accounts")
            _        <- accounts.insertMany(List(accountDoc(Accounts.id, Users.uid1, AccountName("test-account"))))
            users    <- db.getCollection("users")
            _        <- users.insertMany(List(userDoc(Users.uid1, UserEmail("acc1")), userDoc(Users.uid2, UserEmail("acc2"))))
            res      <- test(db)
          yield res
        }
    }.unsafeToFuture()(using IORuntime.global)
}
