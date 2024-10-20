package expensetracker.sync.db

import cats.effect.IO
import cats.effect.unsafe.IORuntime
import expensetracker.MongoOps
import expensetracker.auth.user.UserEmail
import expensetracker.fixtures.{Categories, Transactions, Users}
import mongo4cats.client.MongoClient
import mongo4cats.database.MongoDatabase
import mongo4cats.embedded.EmbeddedMongo
import mongo4cats.operations.{Filter, Update}
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AsyncWordSpec
import squants.market.GBP

import java.time.Instant
import scala.concurrent.Future

class SyncRepositorySpec extends AsyncWordSpec with Matchers with EmbeddedMongo with MongoOps {

  override protected val mongoPort: Int = 12351

  "A SyncRepository" when {
    "pullChanges" should {
      "return initial state when from timestamp is not provided" in {
        withEmbeddedMongoDb { db =>
          for
            repo    <- SyncRepository.make(db)
            changes <- repo.pullChanges(Users.uid1, None)
          yield {
            changes.transactions.created.map(_.id) mustBe List(Transactions.txid)
            changes.categories.created.map(_.id) mustBe List(Categories.cid)
            changes.users.created.map(_.id) mustBe List(Users.uid1)

            changes.transactions.updated mustBe empty
            changes.categories.updated mustBe empty
            changes.users.updated mustBe empty
          }
        }
      }

      "return data changes when from timestamp is before lastUpdatedAt" in {
        withEmbeddedMongoDb { db =>
          for
            categories <- db.getCollection("categories")
            _ <- categories.updateOne(Filter.idEq(Categories.cid.toObjectId), Update.currentDate("lastUpdatedAt"))
            transactions <- db.getCollection("transactions")
            _ <- transactions.updateOne(Filter.idEq(Transactions.txid.toObjectId), Update.currentDate("lastUpdatedAt"))
            repo       <- SyncRepository.make(db)
            changes    <- repo.pullChanges(Users.uid1, Some(Instant.now().minusSeconds(3600)))
          yield {
            changes.transactions.created.map(_.id) mustBe empty
            changes.categories.created.map(_.id) mustBe empty
            changes.users.created.map(_.id) mustBe empty

            changes.transactions.updated.map(_.id) mustBe List(Transactions.txid)
            changes.categories.updated.map(_.id) mustBe List(Categories.cid)
            changes.users.updated mustBe empty
          }
        }
      }

      "return empty change dataset when from timestamp is in the future" in {
        withEmbeddedMongoDb { db =>
          for
            repo    <- SyncRepository.make(db)
            changes <- repo.pullChanges(Users.uid1, Some(Instant.now()))
          yield {
            changes.transactions.created.map(_.id) mustBe empty
            changes.categories.created.map(_.id) mustBe empty
            changes.users.created.map(_.id) mustBe empty

            changes.transactions.updated mustBe empty
            changes.categories.updated mustBe empty
            changes.users.updated mustBe empty
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
            db           <- client.getDatabase("expense-tracker")
            categories   <- db.getCollection("categories")
            _            <- categories.insertMany(List(
              categoryDoc(Categories.cid, "c1", Some(Users.uid1)),
              categoryDoc(Categories.cid2, "c2", Some(Users.uid1), hidden = Some(true))
            ))
            users        <- db.getCollection("users")
            _            <- users.insertMany(List(userDoc(Users.uid1, UserEmail("acc1"))))
            transactions <- db.getCollection("transactions")
            _            <- transactions.insertOne(transactionDoc(Transactions.txid, Categories.cid, Users.uid1, GBP(5.0)))
            res          <- test(db)
          yield res
        }
    }.unsafeToFuture()(IORuntime.global)
}
