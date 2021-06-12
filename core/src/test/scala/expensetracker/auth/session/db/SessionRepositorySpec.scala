package expensetracker.auth.session.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.EmbeddedMongo
import expensetracker.auth.account.AccountId
import expensetracker.auth.session.SessionId
import mongo4cats.client.MongoClientF
import mongo4cats.database.MongoDatabaseF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

import scala.concurrent.duration._
import java.time.{Duration => Dur}

class SessionRepositorySpec extends AnyWordSpec with Matchers with EmbeddedMongo {

  val aid = AccountId(new ObjectId().toHexString)

  "A SessionRepository" should {

    "create new sessions" in {
      withEmbeddedMongoDb { db =>
        val result = for {
          repo <- SessionRepository.make(db)
          sid  <- repo.create(aid, 90.days)
          res  <- repo.find(sid)
        } yield (sid, res)

        result.map { case (sid, sess) =>
          sess.map(_.id) mustBe Some(sid)
          sess.map(_.accountId) mustBe Some(aid)
          sess.map(s => Dur.between(s.createdAt, s.expiresAt).getSeconds) mustBe Some(90.days.toSeconds)
        }
      }
    }

    "return empty option when session does not exist" in {
      withEmbeddedMongoDb { db =>
        val result = for {
          repo <- SessionRepository.make(db)
          res  <- repo.find(SessionId(new ObjectId().toHexString))
        } yield res

        result.map(_ mustBe None)
      }
    }

    "delete session from database" in {
      withEmbeddedMongoDb { db =>
        val result = for {
          repo <- SessionRepository.make(db)
          sid  <- repo.create(aid, 90.days)
          _    <- repo.delete(sid)
          res  <- repo.find(sid)
        } yield res

        result.map(_ mustBe None)
      }
    }
  }

  def withEmbeddedMongoDb[A](test: MongoDatabaseF[IO] => IO[A]): A =
    withRunningEmbeddedMongo(port = 12347) {
      MongoClientF
        .fromConnectionString[IO]("mongodb://localhost:12347")
        .use { client =>
          for {
            db  <- client.getDatabase("expense-tracker")
            res <- test(db)
          } yield res
        }
        .unsafeRunSync()
    }
}
