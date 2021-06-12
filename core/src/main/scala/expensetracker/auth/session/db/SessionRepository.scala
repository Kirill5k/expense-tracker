package expensetracker.auth.session.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.Filters
import io.circe.generic.auto._
import expensetracker.auth.account.AccountId
import expensetracker.auth.session.{Session, SessionId}
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}
import mongo4cats.circe._
import org.bson.types.ObjectId

import scala.concurrent.duration.FiniteDuration

trait SessionRepository[F[_]] {
  def create(aid: AccountId, duration: FiniteDuration): F[SessionId]
  def find(sid: SessionId): F[Option[Session]]
  def delete(sid: SessionId): F[Unit]
}

final private class LiveSessionRepository[F[_]: Async](
    private val collection: MongoCollectionF[SessionEntity]
) extends SessionRepository[F] {

  override def create(aid: AccountId, duration: FiniteDuration): F[SessionId] = {
    val createSession = SessionEntity.create(aid, duration)
    collection.insertOne[F](createSession).as(SessionId(createSession.id.toHexString))
  }

  override def find(sid: SessionId): F[Option[Session]] =
    collection
      .find(Filters.eq("id", new ObjectId(sid.value)))
      .first[F]
      .map(res => Option(res).map(_.toDomain))

  override def delete(sid: SessionId): F[Unit] =
    collection.deleteOne[F](Filters.eq("id", new ObjectId(sid.value))).void
}

object SessionRepository {
  def make[F[_]: Async](db: MongoDatabaseF[F]): F[SessionRepository[F]] =
    db.getCollectionWithCirceCodecs[SessionEntity]("sessions").map(coll => new LiveSessionRepository[F](coll))
}
