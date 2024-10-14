package expensetracker.sync.db

import cats.effect.Async
import cats.syntax.functor.*
import cats.syntax.flatMap.*
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError
import expensetracker.sync.DataChanges
import mongo4cats.bson.syntax.*
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase
import mongo4cats.operations.{Aggregate, Update}
import kirill5k.common.cats.syntax.monadthrow.*
import mongo4cats.bson.{BsonValue as BV, Document}

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

  private def createdComp(collection: String, item: String, from: Option[Instant]) =
    from match
      case Some(value) =>
        Document("$filter" := Document(
          "input" := "$" + collection,
          "as" := item,
          "cond" := Document("$and" := BV.array(
            BV.document("$lt" := BV.array(BV.string("$$" + item + ".createdAt"), BV.instant(value))),
            BV.document("$eq" := BV.array(BV.string("$$" + item + ".lastUpdatedAt"), BV.Null))
          ))
        ))
      case None =>
        Document("$filter" := Document(
          "input" := "$" + collection,
          "as" := item,
          "cond" := BV.document("$ne" := BV.array(BV.string("$$" + item + ".hidden"), BV.False))
        ))

  private def updatedComp(collection: String, item: String, from: Option[Instant]) =
    from match
      case Some(value) =>
        Document("$filter" := Document(
          "input" := "$" + collection,
          "as" := item,
          "cond" := BV.document("$gt" := BV.array(BV.string("$$" + item + ".lastUpdatedAt"), BV.instant(value)))
        ))
      case None =>
        Document("$filter" := Document(
          "input" := "$" + collection,
          "as" := item,
          "cond" := BV.document("$eq" := BV.array(BV.string("$$" + item + "._id"), BV.Null))
        ))

  def pullChanges(uid: UserId, from: Option[Instant]): F[DataChanges] =
    updateTimestamp(uid, "lastPulledAt") >>
      collection
        .aggregate[EntityChanges](
          Aggregate
            .lookup("transactions", "_id", "userId", "transactions")
            .lookup("categories", "_id", "userId", "categories")
            .lookup("users", "_id", "_id", "users")
            .addFields(
              "time" -> "$$NOW",
              "userCreated" -> createdComp("users", "user", from),
              "userUpdated" -> updatedComp("users", "user", from),
              "transactionCreated" -> createdComp("transactions", "transaction", from),
              "transactionUpdated" -> updatedComp("transactions", "transaction", from),
              "categoryCreated" -> createdComp("categories", "category", from),
              "categoryUpdated" -> updatedComp("categories", "category", from),
            ).addFields(
              "transactions" -> Document(
                "created" := "$transactionCreated",
                "updated" := "$transactionUpdated"
              )
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
