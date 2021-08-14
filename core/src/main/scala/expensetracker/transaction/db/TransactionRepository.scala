package expensetracker.transaction.db

import cats.effect.Async
import cats.implicits._
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId}
import expensetracker.common.json._
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import io.circe.generic.auto._
import mongo4cats.circe._
import mongo4cats.collection.operations.Filter
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase

trait TransactionRepository[F[_]] extends Repository[F] {
  def create(tx: CreateTransaction): F[TransactionId]
  def getAll(aid: UserId): F[List[Transaction]]
  def get(aid: UserId, txid: TransactionId): F[Transaction]
  def delete(aid: UserId, txid: TransactionId): F[Unit]
  def update(tx: Transaction): F[Unit]
  def hide(aid: UserId, txid: TransactionId, hidden: Boolean = true): F[Unit]
  def isHidden(aid: UserId, txid: TransactionId): F[Boolean]
}

final private class LiveTransactionRepository[F[_]: Async](
    private val collection: MongoCollection[F, TransactionEntity]
) extends TransactionRepository[F] {

  override def create(tx: CreateTransaction): F[TransactionId] = {
    val create = TransactionEntity.create(tx)
    collection
      .insertOne(create)
      .as(TransactionId(create._id.toHexString))
  }

  override def getAll(aid: UserId): F[List[Transaction]] =
    collection
      .find(userIdEq(aid) and notHidden)
      .sortByDesc("date")
      .all
      .map(_.map(_.toDomain).toList)

  override def get(aid: UserId, txid: TransactionId): F[Transaction] =
    collection
      .find(userIdEq(aid) and idEq(txid.value))
      .first
      .flatMap {
        case Some(tx) => tx.toDomain.pure[F]
        case None => TransactionDoesNotExist(txid).raiseError[F, Transaction]
      }

  override def update(tx: Transaction): F[Unit] =
    collection
      .findOneAndReplace(
        userIdEq(tx.userId) and idEq(tx.id.value),
        TransactionEntity.from(tx)
      )
      .flatMap(errorIfNull(TransactionDoesNotExist(tx.id)))
      .void

  override def delete(aid: UserId, txid: TransactionId): F[Unit] =
    collection
      .findOneAndDelete(userIdEq(aid) and idEq(txid.value))
      .flatMap(errorIfNull(TransactionDoesNotExist(txid)))
      .void

  override def hide(aid: UserId, txid: TransactionId, hidden: Boolean): F[Unit] =
    collection
      .updateOne(userIdEq(aid) and idEq(txid.value), updateHidden(hidden))
      .flatMap(errorIfNoMatches(TransactionDoesNotExist(txid)))

  override def isHidden(aid: UserId, txid: TransactionId): F[Boolean] =
    collection
      .count(userIdEq(aid) and idEq(txid.value) and Filter.eq(HiddenField, true))
      .map(_ > 0)
}

object TransactionRepository {

  def make[F[_]: Async](db: MongoDatabase[F]): F[TransactionRepository[F]] =
    db.getCollectionWithCodec[TransactionEntity]("transactions")
      .map(coll => new LiveTransactionRepository[F](coll))
}
