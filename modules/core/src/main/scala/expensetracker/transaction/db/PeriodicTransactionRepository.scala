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
import expensetracker.transaction.{CreatePeriodicTransaction, PeriodicTransaction, RecurrencePattern, TransactionId}
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
  def getAllByRecurrenceDate(date: LocalDate): F[List[PeriodicTransaction]]
  def deleteAll(uid: UserId): F[Unit]

final private class LivePeriodicTransactionRepository[F[_]](
    private val collection: MongoCollection[F, PeriodicTransactionEntity],
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

  override def getAll(uid: UserId): F[List[PeriodicTransaction]] =
    collection
      .aggregate[PeriodicTransactionEntity](findTxWithCategoryAndAccount(userIdEq(uid) && notHidden))
      .all
      .mapList(_.toDomain)

  override def update(tx: PeriodicTransaction): F[Unit] =
    collection
      .updateOne(tx.toFilterById, tx.toUpdate)
      .flatMap(errorIfNoMatches(TransactionDoesNotExist(tx.id)))

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
          Filter.eq("recurrence.nextDate", date) &&
          (Filter.isNull("recurrence.endDate") || Filter.gt("recurrence.endDate", date))
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
      .map(coll => LivePeriodicTransactionRepository[F](coll, cs, acid))
