package expensetracker.transaction.db

import cats.effect.Async
import cats.syntax.applicativeError.*
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.auth.user.UserId
import expensetracker.account.AccountId
import expensetracker.category.CategoryId
import expensetracker.common.JsonCodecs
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError
import expensetracker.common.errors.AppError.{CategoryDoesNotExist, TransactionDoesNotExist}
import expensetracker.transaction.{CreatePeriodicTransaction, PeriodicTransaction, RecurrenceCheckpoint, RecurrencePattern, TransactionId}
import kirill5k.common.cats.syntax.applicative.*
import mongo4cats.circe.MongoJsonCodecs
import mongo4cats.client.ClientSession
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase
import mongo4cats.models.collection.WriteCommand
import mongo4cats.operations.{Filter, Update}
import squants.market.Money

import java.time.LocalDate

trait PeriodicTransactionRepository[F[_]] extends Repository[F]:
  def create(tx: CreatePeriodicTransaction): F[PeriodicTransaction]
  def getAll(uid: UserId): F[List[PeriodicTransaction]]
  def update(tx: PeriodicTransaction): F[Unit]
  def hide(uid: UserId, txid: TransactionId, hidden: Boolean = true): F[Unit]
  def hideByCategory(cid: CategoryId, hidden: Boolean): F[Unit]
  def hideByAccount(aid: AccountId, hidden: Boolean): F[Unit]
  def save(txs: List[PeriodicTransaction]): F[Unit]
  def advanceRecurrences(checkpoints: List[RecurrenceCheckpoint]): F[Unit]
  def validCheckpointIds(checkpoints: List[RecurrenceCheckpoint]): F[Set[TransactionId]]
  def getAllByRecurrenceDate(date: LocalDate): F[List[PeriodicTransaction]]
  def deleteAll(uid: UserId): F[Unit]

final private class LivePeriodicTransactionRepository[F[_]](
    private val collection: MongoCollection[F, PeriodicTransactionEntity],
    private val references: TransactionReferences[F],
    private val session: ClientSession[F],
    private val acid: Boolean
)(using
    F: Async[F]
) extends PeriodicTransactionRepository[F] {

  extension (tx: PeriodicTransaction)
    private def toFilterById: Filter =
      userIdEq(tx.userId) && idEq(tx.id.toObjectId)
    private def toUpdate: Update = {
      var upd = Update
        .setOnInsert(Field.Id, tx.id.toObjectId)
        .setOnInsert(Field.UId, tx.userId.toObjectId)
        .set(Field.CId, tx.categoryId.toObjectId)
        .set(Field.AId, tx.accountId.map(_.toObjectId))
        .set(Field.Amount, tx.amount)
        .set(Field.Note, tx.note)
        .set(Field.Recurrence, tx.recurrence)
        .set(Field.Tags, tx.tags)
        .set(Field.Hidden, tx.hidden)

      upd = tx.createdAt.fold(upd.setOnInsert(Field.CreatedAt, now))(ts => upd.set(Field.CreatedAt, ts))
      upd = tx.lastUpdatedAt.fold(upd.currentDate(Field.LastUpdatedAt))(ts => upd.set(Field.LastUpdatedAt, ts))
      upd
    }

  override def create(ctx: CreatePeriodicTransaction): F[PeriodicTransaction] =
    (for
      _ <- session.startTransaction
      create = PeriodicTransactionEntity.create(ctx)
      res <- if acid then collection.insertOne(session, create) else collection.insertOne(create)
      agg = findTxWithCategoryAndAccount(idEq(res.getInsertedId.asObjectId().getValue))
      tx <-
        if acid then collection.aggregate[PeriodicTransactionEntity](session, agg).first
        else collection.aggregate[PeriodicTransactionEntity](agg).first
      _ <- F.raiseWhen(tx.exists(_.containsInvalidCategory))(CategoryDoesNotExist(ctx.categoryId))
      _ <- F.raiseWhen(tx.exists(_.containsInvalidAccount))(AppError.AccountDoesNotExist(ctx.accountId.get))
      _ <- session.commitTransaction
    yield tx.get.toDomain).onError { case _ =>
      session.abortTransaction
    }

  override def save(txs: List[PeriodicTransaction]): F[Unit] =
    val cmds = txs.map(tx => WriteCommand.UpdateOne(tx.toFilterById, tx.toUpdate, upsertUpdateOpt))
    collection.bulkWrite(cmds).void

  private def checkpointFilter(checkpoint: RecurrenceCheckpoint): Filter =
    userIdEq(checkpoint.userId) && idEq(checkpoint.id.toObjectId) && notHidden &&
      Filter.eq(Field.Recurrence, checkpoint.previousRecurrence)

  override def validCheckpointIds(checkpoints: List[RecurrenceCheckpoint]): F[Set[TransactionId]] =
    if checkpoints.isEmpty then F.pure(Set.empty)
    else
      collection
        .find(Filter.or(checkpoints.map(checkpointFilter)*))
        .all
        .map(_.map(tx => TransactionId(tx._id)).toSet)

  override def advanceRecurrences(checkpoints: List[RecurrenceCheckpoint]): F[Unit] =
    val cmds = checkpoints.map { checkpoint =>
      val update = Update.set("recurrence.nextDate", checkpoint.nextDate).currentDate(Field.LastUpdatedAt)
      WriteCommand.UpdateOne(checkpointFilter(checkpoint), update)
    }
    collection.bulkWrite(cmds).void

  override def getAll(uid: UserId): F[List[PeriodicTransaction]] =
    collection
      .aggregate[PeriodicTransactionEntity](findTxWithCategoryAndAccount(userIdEq(uid) && notHidden))
      .all
      .mapList(_.toDomain)

  override def update(tx: PeriodicTransaction): F[Unit] =
    for
      existing <- collection.count(tx.toFilterById)
      _        <- F.raiseWhen(existing == 0)(TransactionDoesNotExist(tx.id))
      _        <- references.validate(tx.userId, tx.categoryId, tx.accountId)
      result   <- collection.updateOne(tx.toFilterById, tx.toUpdate)
      _        <- errorIfNoMatches(TransactionDoesNotExist(tx.id))(result)
    yield ()

  override def hide(uid: UserId, txid: TransactionId, hidden: Boolean): F[Unit] =
    collection
      .updateOne(userIdEq(uid) && idEq(txid.toObjectId), updateHidden(hidden))
      .flatMap(errorIfNoMatches(TransactionDoesNotExist(txid)))

  override def hideByCategory(cid: CategoryId, hidden: Boolean): F[Unit] =
    collection
      .updateMany(Filter.eq(Field.CId, cid.toObjectId), updateHidden(hidden))
      .void

  override def hideByAccount(aid: AccountId, hidden: Boolean): F[Unit] =
    collection
      .updateMany(Filter.eq(Field.AId, aid.toObjectId), updateHidden(hidden))
      .void

  override def getAllByRecurrenceDate(date: LocalDate): F[List[PeriodicTransaction]] =
    collection
      .find(
        notHidden &&
          (Filter.lte("recurrence.nextDate", date) ||
            (Filter.isNull("recurrence.nextDate") && Filter.lte("recurrence.startDate", date))) &&
          (Filter.isNull("recurrence.endDate") || Filter.expr(
            org.bson.Document.parse(
              """{"$lt": [{"$ifNull": ["$recurrence.nextDate", "$recurrence.startDate"]}, "$recurrence.endDate"]}"""
            )
          ))
      )
      .all
      .mapList(_.toDomain)

  override def deleteAll(uid: UserId): F[Unit] =
    collection.deleteMany(userIdEq(uid)).void
}

object PeriodicTransactionRepository extends MongoJsonCodecs with JsonCodecs:
  import PeriodicTransactionEntity.given
  def make[F[_]: Async](db: MongoDatabase[F], cs: ClientSession[F], acid: Boolean = true): F[PeriodicTransactionRepository[F]] =
    db.getCollectionWithCodec[PeriodicTransactionEntity]("periodic-transactions")
      .map(_.withAddedCodec[Money].withAddedCodec[RecurrencePattern])
      .map(coll => LivePeriodicTransactionRepository[F](coll, TransactionReferences[F](db), cs, acid))
