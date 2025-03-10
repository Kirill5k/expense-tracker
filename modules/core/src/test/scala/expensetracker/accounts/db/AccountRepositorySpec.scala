package expensetracker.accounts.db

import cats.effect.IO
import cats.effect.unsafe.IORuntime
import expensetracker.MongoOps
import expensetracker.accounts.AccountName
import expensetracker.auth.user.UserEmail
import expensetracker.fixtures.Accounts
import expensetracker.fixtures.Users
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
      "create new account in db" in {
        withEmbeddedMongoDb { client =>
          val create = Accounts.create()
          val result = for
            repo   <- AccountRepository.make(client)
            newAcc <- repo.create(create)
            accs   <- repo.getAll(Users.uid1)
          yield accs -> newAcc

          result.map { (accs, newAcc) =>
            accs.map(_.id) must contain(newAcc.id)
          }
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
            db       <- client.getDatabase("expense-tracker")
            accounts <- db.getCollection("accounts")
            _        <- accounts.insertMany(List(accountDoc(Accounts.id, Users.uid1, AccountName("test-account"))))
            users    <- db.getCollection("users")
            _        <- users.insertMany(List(userDoc(Users.uid1, UserEmail("acc1")), userDoc(Users.uid2, UserEmail("acc2"))))
            res      <- test(db)
          yield res
        }
    }.unsafeToFuture()(IORuntime.global)
}
