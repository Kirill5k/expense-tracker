package expensetracker.auth.session.db

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import cats.implicits._
import com.comcast.ip4s.IpAddress
import expensetracker.EmbeddedMongo
import expensetracker.auth.account.AccountId
import expensetracker.auth.session.{CreateSession, Session, SessionActivity, SessionId, SessionStatus}
import mongo4cats.client.MongoClientF
import mongo4cats.database.MongoDatabaseF
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

import java.time.Instant
import java.time.temporal.ChronoField

class SessionRepositorySpec extends AnyWordSpec with Matchers with EmbeddedMongo {

  override protected val mongoPort: Int = 12347

  val aid = AccountId(new ObjectId().toHexString)
  val ts = Instant.now().`with`(ChronoField.MILLI_OF_SECOND, 0)

  "A SessionRepository" should {

    "create new sessions" in {
      withEmbeddedMongoDb { db =>
        val create = CreateSession(aid, IpAddress.fromString("127.0.0.1"), ts)
        val result = for {
          repo <- SessionRepository.make(db)
          sid  <- repo.create(create)
          res  <- repo.find(sid, None)
        } yield (sid, res)

        result.map { case (sid, sess) =>
          sess mustBe Session(
            sid,
            aid,
            create.time,
            true,
            SessionStatus.Authenticated,
            create.ipAddress.map(ip => SessionActivity(ip, create.time))
          ).some
        }
      }
    }

    "return empty option when session does not exist" in {
      withEmbeddedMongoDb { db =>
        val result = for {
          repo <- SessionRepository.make(db)
          res  <- repo.find(SessionId(new ObjectId().toHexString), None)
        } yield res

        result.map(_ mustBe None)
      }
    }

    "unauth session" in {
      withEmbeddedMongoDb { db =>
        val create = CreateSession(aid, IpAddress.fromString("127.0.0.1"), ts)
        val result = for {
          repo <- SessionRepository.make(db)
          sid  <- repo.create(create)
          _    <- repo.unauth(sid)
          res  <- repo.find(sid, None)
        } yield res

        result.map { s =>
          val sess = s.get
          sess.active mustBe false
          sess.status mustBe SessionStatus.LoggedOut
        }
      }
    }

    "update session last recorded activity on find" in {
      withEmbeddedMongoDb { db =>
        val activity = IpAddress.fromString("192.168.0.1").map(ip => SessionActivity(ip, ts))
        val result = for {
          repo <- SessionRepository.make(db)
          sid  <- repo.create(CreateSession(aid, None, ts))
          _    <- repo.find(sid, activity)
          res  <- repo.find(sid, None)
        } yield res

        result.map { sess =>
          sess.flatMap(_.lastRecordedActivity) mustBe activity
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
            db  <- client.getDatabase("expense-tracker")
            res <- test(db)
          } yield res
        }
        .unsafeRunSync()
    }
}
