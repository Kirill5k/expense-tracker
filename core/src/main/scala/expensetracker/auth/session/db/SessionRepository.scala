package expensetracker.auth.session.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.Updates
import io.circe.generic.auto._
import expensetracker.auth.session.{CreateSession, Session, SessionActivity, SessionId}
import expensetracker.common.db.Repository
import expensetracker.common.json._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}
import mongo4cats.circe._
import org.bson.Document

import scala.jdk.CollectionConverters._

trait SessionRepository[F[_]] extends Repository[F] {
  def create(cs: CreateSession): F[SessionId]
  def find(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]]
  def unauth(sid: SessionId): F[Unit]
}

final private class LiveSessionRepository[F[_]: Async](
    private val collection: MongoCollectionF[SessionEntity]
) extends SessionRepository[F] {

  override def create(cs: CreateSession): F[SessionId] = {
    val createSession = SessionEntity.create(cs)
    collection.insertOne[F](createSession).as(SessionId(createSession._id.toHexString))
  }

  override def find(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]] = {
    val idFilter =idEq(IdField, sid.value)
    val sess = activity
      .map(sa => new Document(Map[String, Object]("ipAddress" -> sa.ipAddress.toUriString, "time" -> sa.time).asJava))
      .map(sa => collection.findOneAndUpdate(idFilter, Updates.set("lastRecordedActivity", sa)))
      .getOrElse(collection.find(idFilter).first[F])

    sess.map(res => Option(res).map(_.toDomain))
  }

  override def unauth(sid: SessionId): F[Unit] = {
    collection.updateOne(
      idEq(IdField, sid.value),
      Updates.combine(Updates.set("status", "logged-out"), Updates.set("active", false))
    )
      .void
  }
}

object SessionRepository {
  def make[F[_]: Async](db: MongoDatabaseF[F]): F[SessionRepository[F]] =
    db.getCollectionWithCirceCodecs[SessionEntity]("sessions").map(coll => new LiveSessionRepository[F](coll))
}
