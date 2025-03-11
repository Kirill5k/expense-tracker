package expensetracker.transaction.db

import cats.effect.Async
import cats.syntax.applicativeError.*
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.common.JsonCodecs
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId}
import kirill5k.common.cats.syntax.applicative.*
import kirill5k.common.cats.syntax.monadthrow.*
import mongo4cats.circe.MongoJsonCodecs
import mongo4cats.client.ClientSession
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase
import mongo4cats.models.collection.WriteCommand
import mongo4cats.operations.{Filter, Update}
import squants.Money

trait TransactionRepository[F[_]] extends Repository[F]:
  def create(tx: CreateTransaction): F[Transaction]
  def getAll(uid: UserId, from: Option[Instant], to: Option[Instant]): F[List[Transaction]]
  def get(uid: UserId, txid: TransactionId): F[Transaction]
  def delete(uid: UserId, txid: TransactionId): F[Unit]
  def update(tx: Transaction): F[Unit]
  def hide(uid: UserId, txid: TransactionId, hidden: Boolean = true): F[Unit]
  def hide(cid: CategoryId, hidden: Boolean): F[Unit]
  def isHidden(uid: UserId, txid: TransactionId): F[Boolean]
  def save(txs: List[Transaction]): F[Unit]
  def deleteAll(uid: UserId): F[Unit]

final private class LiveTransactionRepository[F[_]](
    private val collection: MongoCollection[F, TransactionEntity],
    private val session: ClientSession[F],
    private val acid: Boolean
)(using
    F: Async[F]
) extends TransactionRepository[F] {

  extension (tx: Transaction)
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
        .set(Field.Date, tx.date)
        .set(Field.Tags, tx.tags)
        .set(Field.Hidden, tx.hidden)
        .set("parentTransactionId", tx.parentTransactionId.map(_.toObjectId))
        .set("isRecurring", tx.isRecurring)

      upd = tx.createdAt.fold(upd.setOnInsert(Field.CreatedAt, now))(ts => upd.set(Field.CreatedAt, ts))
      upd = tx.lastUpdatedAt.fold(upd.currentDate(Field.LastUpdatedAt))(ts => upd.set(Field.LastUpdatedAt, ts))
      upd
    }

  override def create(ctx: CreateTransaction): F[Transaction] =
    (for
      _ <- session.startTransaction
      create = TransactionEntity.create(ctx)
      res <- if acid then collection.insertOne(session, create) else collection.insertOne(create)
      agg = findTxWithCategoryAndAccount(idEq(res.getInsertedId.asObjectId().getValue))
      tx <- if acid then collection.aggregate[TransactionEntity](session, agg).first else collection.aggregate[TransactionEntity](agg).first
      _  <- F.raiseWhen(tx.exists(_.containsInvalidCategory))(AppError.CategoryDoesNotExist(ctx.categoryId))
      _  <- session.commitTransaction
    yield tx.get.toDomain).onError { case _ =>
      session.abortTransaction
    }

  override def getAll(uid: UserId, from: Option[Instant], to: Option[Instant]): F[List[Transaction]] =
    collection
      .aggregate[TransactionEntity](findTxWithCategoryAndAccount(userIdEq(uid) && notHidden && dateRangeSelector(from, to)))
      .all
      .mapList(_.toDomain)

  private def dateRangeSelector(from: Option[Instant], to: Option[Instant]): Filter = {
    val fromFilter = from.map(d => Filter.gte(Field.Date, d))
    val toFilter   = to.map(d => Filter.lt(Field.Date, d))
    List(fromFilter, toFilter).flatten.foldLeft(Filter.empty)((acc, el) => acc && el)
  }

  override def get(uid: UserId, txid: TransactionId): F[Transaction] =
    collection
      .find(userIdEq(uid).and(idEq(txid.toObjectId)))
      .first
      .mapOpt(_.toDomain)
      .unwrapOpt(TransactionDoesNotExist(txid))

  override def update(tx: Transaction): F[Unit] =
    collection
      .updateOne(tx.toFilterById, tx.toUpdate)
      .flatMap(errorIfNoMatches(TransactionDoesNotExist(tx.id)))

  override def delete(uid: UserId, txid: TransactionId): F[Unit] =
    collection
      .deleteOne(userIdEq(uid) && idEq(txid.toObjectId))
      .flatMap { result =>
        F.raiseWhen(result.getDeletedCount == 0)(TransactionDoesNotExist(txid))
      }

  override def hide(uid: UserId, txid: TransactionId, hidden: Boolean): F[Unit] =
    collection
      .updateOne(userIdEq(uid) && idEq(txid.toObjectId), updateHidden(hidden))
      .flatMap(errorIfNoMatches(TransactionDoesNotExist(txid)))

  override def hide(cid: CategoryId, hidden: Boolean): F[Unit] =
    collection
      .updateMany(Filter.eq(Field.CId, cid.toObjectId), updateHidden(hidden))
      .void

  override def isHidden(uid: UserId, txid: TransactionId): F[Boolean] =
    collection
      .count(userIdEq(uid) && idEq(txid.toObjectId) && Filter.eq(Field.Hidden, true))
      .map(_ > 0)

  override def save(txs: List[Transaction]): F[Unit] =
    val cmds = txs.map(tx => WriteCommand.UpdateOne(tx.toFilterById, tx.toUpdate, upsertUpdateOpt))
    collection.bulkWrite(cmds).void

  override def deleteAll(uid: UserId): F[Unit] =
    collection.deleteMany(userIdEq(uid)).void
}

object TransactionRepository extends MongoJsonCodecs with JsonCodecs:
  def make[F[_]: Async](db: MongoDatabase[F], cs: ClientSession[F], acid: Boolean = true): F[TransactionRepository[F]] =
    db.getCollectionWithCodec[TransactionEntity]("transactions")
      .map(_.withAddedCodec[Money])
      .map(coll => LiveTransactionRepository[F](coll, cs, acid))
