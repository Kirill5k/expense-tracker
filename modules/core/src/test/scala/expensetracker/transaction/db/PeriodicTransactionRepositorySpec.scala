package expensetracker.transaction.db

import cats.effect.IO
import cats.effect.unsafe.IORuntime
import expensetracker.MongoOps
import expensetracker.auth.user.UserEmail
import expensetracker.fixtures.{Categories, Users}
import mongo4cats.client.{ClientSession, MongoClient}
import mongo4cats.database.MongoDatabase
import mongo4cats.embedded.EmbeddedMongo
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec

import scala.concurrent.Future

class PeriodicTransactionRepositorySpec extends AsyncWordSpec with EmbeddedMongo with Matchers with MongoOps {
  override protected val mongoPort: Int = 12352


  "PeriodicTransactionRepository" when {
    
  }
  
  def withEmbeddedMongoDb[A](test: (MongoDatabase[IO], ClientSession[IO]) => IO[A]): Future[A] =
    withRunningEmbeddedMongo {
      MongoClient
        .fromConnectionString[IO](s"mongodb://localhost:$mongoPort")
        .flatMap { mc =>
          mc.startSession.map(cs => mc -> cs)
        }
        .use { case (client, sess) =>
          for
            db <- client.getDatabase("expense-tracker")
            categories <- db.getCollection("categories")
            _ <- categories.insertMany(List(categoryDoc(Categories.cid, "category-1"), categoryDoc(Categories.cid2, "category-2")))
            accs <- db.getCollection("users")
            _ <- accs.insertMany(List(userDoc(Users.uid1, UserEmail("acc-1")), userDoc(Users.uid2, UserEmail("acc-2"))))
            res <- test(db, sess)
          yield res
        }
    }.unsafeToFuture()(IORuntime.global)
}
