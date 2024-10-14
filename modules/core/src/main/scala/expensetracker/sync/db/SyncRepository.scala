package expensetracker.sync

import cats.effect.Async
import cats.syntax.functor.*
import cats.syntax.flatMap.*
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError
import expensetracker.sync.db.{EntityChanges, SyncEntity}
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase
import mongo4cats.operations.{Aggregate, Filter, Projection, Update}
import kirill5k.common.cats.syntax.monadthrow.*

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

  private def createdFacet(fieldPrefix: String, from: Option[Instant]) =
    Aggregate.Facet(
      "created",
      Aggregate.matchBy(
        from match
          case Some(value) => Filter.gt(fieldPrefix + Field.CreatedAt, value) && Filter.isNull(fieldPrefix + Field.LastUpdatedAt)
          case None        => Filter.empty
      )
    )

  private def updatedFacet(fieldPrefix: String, from: Option[Instant]) =
    Aggregate.Facet(
      "updated",
      Aggregate.matchBy(
        from match
          case Some(value) => Filter.gt(fieldPrefix + Field.LastUpdatedAt, value)
          case None        => Filter.isNull(Field.Id)
      )
    )

  def pullChanges(uid: UserId, from: Option[Instant]): F[DataChanges] =
    updateTimestamp(uid, "lastPulledAt") >>
      collection
        .aggregate[EntityChanges](
          Aggregate
            .lookup("transactions", "_id", "userId", "transactions")
            .lookup("categories", "_id", "userId", "categories")
            .lookup("users", "_id", "_id", "users")
            .facet(
              Aggregate.Facet(
                "transactions",
                Aggregate.unwind("$transactions").facet(createdFacet("transactions.", from), updatedFacet("transactions.", from))
              ),
              Aggregate.Facet(
                "categories",
                Aggregate.unwind("$categories").facet(createdFacet("categories.", from), updatedFacet("categories.", from))
              ),
              Aggregate.Facet(
                "users",
                Aggregate.unwind("$users").facet(createdFacet("users.", from), updatedFacet("users.", from))
              )
            )
            .project(Projection.computed("time", "$lastPulledAt"))
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
