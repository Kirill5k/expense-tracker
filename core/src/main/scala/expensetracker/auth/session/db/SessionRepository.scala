package expensetracker.auth.session.db

import cats.effect.Async
import cats.syntax.functor.*
import expensetracker.auth.user.UserId
import expensetracker.auth.session.{CreateSession, Session, SessionId, SessionStatus}
import expensetracker.common.db.Repository
import expensetracker.common.json.given
import mongo4cats.database.MongoDatabase
import mongo4cats.circe.MongoJsonCodecs
import mongo4cats.operations.Update
import mongo4cats.collection.MongoCollection

trait SessionRepository[F[_]] extends Repository[F]:
  def create(cs: CreateSession): F[SessionId]
  def find(sid: SessionId): F[Option[Session]]
  def unauth(sid: SessionId): F[Unit]
  def invalidatedAll(uid: UserId): F[Unit]

final private class LiveSessionRepository[F[_]: Async](
    private val collection: MongoCollection[F, SessionEntity]
) extends SessionRepository[F] {

  private val logoutUpdate     = Update.set(Field.Status, SessionStatus.LoggedOut).set("active", false)
  private val invalidateUpdate = Update.set(Field.Status, SessionStatus.Invalidated).set("active", false)

  override def create(cs: CreateSession): F[SessionId] = {
    val createSession = SessionEntity.create(cs)
    collection.insertOne(createSession).as(SessionId(createSession._id.toHexString))
  }

  override def find(sid: SessionId): F[Option[Session]] =
    collection
      .findOneAndUpdate(idEq(sid.toObjectId), Update.currentDate(Field.LastAccessedAt))
      .map(_.map(_.toDomain))

  override def unauth(sid: SessionId): F[Unit] =
    collection.updateOne(idEq(sid.toObjectId), logoutUpdate).void

  override def invalidatedAll(uid: UserId): F[Unit] =
    collection.updateMany(userIdEq(uid), invalidateUpdate).void
}

object SessionRepository extends MongoJsonCodecs:
  def make[F[_]: Async](db: MongoDatabase[F]): F[SessionRepository[F]] =
    db.getCollectionWithCodec[SessionEntity]("sessions")
      .map(_.withAddedCodec[SessionStatus])
      .map(coll => LiveSessionRepository[F](coll))
