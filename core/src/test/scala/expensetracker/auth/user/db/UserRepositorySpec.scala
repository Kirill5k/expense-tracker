package expensetracker.auth.user.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.auth.user.UserId
import mongo4cats.client.MongoClientF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

class UserRepositorySpec extends AnyWordSpec with Matchers with EmbeddedMongo {

  val user1Id = UserId(new ObjectId().toHexString)

  "A UserRepository" should {

    "find user by name" in {}
  }

  def withEmbeddedMongoClient[A](test: MongoClientF[IO] => IO[A]): A =
    withRunningEmbeddedMongo(port = 12348) {
      MongoClientF
        .fromConnectionString[IO]("mongodb://localhost:12348")
        .use { client =>
          for {
            db    <- client.getDatabase("expense-tracker")
            users <- db.getCollection("users")
            _     <- users.insertMany[IO](List(userDoc(user1Id, "user-1")))
            res   <- test(client)
          } yield res
        }
        .unsafeRunSync()
    }
}
