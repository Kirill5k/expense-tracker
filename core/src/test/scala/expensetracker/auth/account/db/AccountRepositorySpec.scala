package expensetracker.auth.account.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.auth.account.{AccountId, AccountEmail}
import mongo4cats.client.MongoClientF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

class AccountRepositorySpec extends AnyWordSpec with Matchers with EmbeddedMongo {

  val user1Id = AccountId(new ObjectId().toHexString)

  "A UserRepository" should {

    "find user by name" in {
      withEmbeddedMongoClient { client =>
        val result = for {
          repo <- AccountRepository.make(client)
          user <- repo.find(AccountEmail("user-1@et.com"))
        } yield user

        result.map { u =>
          u.map(_.id) mustBe Some(user1Id)
        }
      }
    }
  }

  def withEmbeddedMongoClient[A](test: MongoClientF[IO] => IO[A]): A =
    withRunningEmbeddedMongo(port = 12348) {
      MongoClientF
        .fromConnectionString[IO]("mongodb://localhost:12348")
        .use { client =>
          for {
            db    <- client.getDatabase("expense-tracker")
            users <- db.getCollection("users")
            _     <- users.insertMany[IO](List(accDoc(user1Id, "user-1@et.com")))
            res   <- test(client)
          } yield res
        }
        .unsafeRunSync()
    }
}
