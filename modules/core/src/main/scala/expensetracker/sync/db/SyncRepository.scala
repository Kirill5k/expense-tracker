package expensetracker.sync

import cats.effect.Async
import cats.syntax.functor.*
import cats.syntax.flatMap.*
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError
import expensetracker.sync.db.{EntityChanges, SyncEntity}
import mongo4cats.bson.syntax.*
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase
import mongo4cats.operations.{Aggregate, Filter, Projection, Update}
import kirill5k.common.cats.syntax.monadthrow.*
import mongo4cats.bson.{BsonValue, Document}

import java.time.Instant

trait SyncRepository[F[_]] extends Repository[F]:
  def pullChanges(uid: UserId, from: Option[Instant]): F[DataChanges]

final private class LiveSyncRepository[F[_]](
    private val collection: MongoCollection[F, SyncEntity]
)(using
    F: Async[F]
) extends SyncRepository[F] {

  private def updateTimestamp(uid: UserId, field: String): F[Unit] =
    collection
      .updateOne(idEq(uid.toObjectId), Update.currentDate(field))
      .flatMap(r => F.whenA(r.getMatchedCount == 0)(collection.insertOne(SyncEntity.from(uid))))

  private def createdAgg(collection: String, from: Option[Instant]) =
    Aggregate.matchBy(
      from match
        case Some(value) => Filter.gt(collection + Field.CreatedAt, value) && Filter.isNull(collection + Field.LastUpdatedAt)
        case None        => Filter.empty
    ).project(Projection.include(collection))

  private def updatedAgg(collection: String, from: Option[Instant]) =
    Aggregate.matchBy(
      from match
        case Some(value) => Filter.gt(collection + "." + Field.LastUpdatedAt, value)
        case None        => Filter.isNull(Field.Id)
    ).project(Projection.include(collection))

  def pullChanges(uid: UserId, from: Option[Instant]): F[DataChanges] =
    updateTimestamp(uid, "lastPulledAt") >>
      collection
        .aggregate[EntityChanges](
          Aggregate
            .lookup("transactions", "_id", "userId", "transactions")
            .lookup("categories", "_id", "userId", "categories")
            .lookup("users", "_id", "_id", "users")
            .unwind("$transactions")
            .unwind("$categories")
            .unwind("$users")
            .facet(
              Aggregate.Facet("transactionsCreated", createdAgg("transactions", from)),
              Aggregate.Facet("categoriesCreated", createdAgg("categories", from)),
              Aggregate.Facet("usersCreated", createdAgg("users", from)),
              Aggregate.Facet("transactionsUpdated", updatedAgg("transactions", from)),
              Aggregate.Facet("categoriesUpdated", updatedAgg("categories", from)),
              Aggregate.Facet("usersUpdated", updatedAgg("users", from)),
            )
            .addFields("time" -> "$$NOW")
            .project(
              Projection
                .include("time")
                .computed("users", Document("created" := "$usersCreated.users", "updated" := "$usersUpdated.users"))
                .computed("categories", Document("created" := "$categoriesCreated.categories", "updated" := "$categoriesUpdated.categories"))
                .computed("transactions", Document("created" := "$transactionsCreated.transactions", "updated" := "$transactionsUpdated.transactions"))
            )
        )
        .first
        .unwrapOpt(AppError.Internal("No result when pulling sync changes"))
        .map(_.toDomain)
}

object SyncRepository:
  def make[F[_]: Async](db: MongoDatabase[F]): F[SyncRepository[F]] =
    db.getCollectionWithCodec[SyncEntity]("sync")
      .map(_.withAddedCodec[EntityChanges])
      .map(coll => LiveSyncRepository[F](coll))
