package expensetracker.auth.session.db

import cats.effect.Async
import cats.implicits._
import expensetracker.auth.user.UserId
import io.circe.generic.auto._
import expensetracker.auth.session.{CreateSession, Session, SessionActivity, SessionId}
import expensetracker.common.db.Repository
import expensetracker.common.json._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}
import mongo4cats.circe._
import mongo4cats.database.operations.Update

trait SessionRepository[F[_]] extends Repository[F] {
  def create(cs: CreateSession): F[SessionId]
  def find(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]]
  def unauth(sid: SessionId): F[Unit]
  def invalidatedAll(aid: UserId): F[Unit]
}

final private class LiveSessionRepository[F[_]: Async](
    private val collection: MongoCollectionF[SessionEntity]
) extends SessionRepository[F] {

  private val logoutUpdate     = Update.set("status", "logged-out").set("active", false)
  private val invalidateUpdate = Update.set("status", "invalidated").set("active", false)

  override def create(cs: CreateSession): F[SessionId] = {
    val createSession = SessionEntity.create(cs)
    collection.insertOne[F](createSession).as(SessionId(createSession._id.toHexString))
  }

  override def find(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]] = {
    val idFilter = idEq(sid.value)
    val sess = activity
      .map(sa => collection.findOneAndUpdate(idFilter, Update.set("lastRecordedActivity", sa)))
      .getOrElse(collection.find(idFilter).first[F])

    sess.map(res => Option(res).map(_.toDomain))
  }

  override def unauth(sid: SessionId): F[Unit] =
    collection.updateOne(idEq(sid.value), logoutUpdate).void

  override def invalidatedAll(aid: UserId): F[Unit] =
    collection.updateMany(userIdEq(aid), invalidateUpdate).void
}

object SessionRepository {
  def make[F[_]: Async](db: MongoDatabaseF[F]): F[SessionRepository[F]] =
    db
      .getCollectionWithCodec[SessionEntity]("sessions")
      .map(_.withAddedCodec[SessionActivity])
      .map(coll => new LiveSessionRepository[F](coll))
}
