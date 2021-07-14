package expensetracker.transaction.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.{Filters, Updates}
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId}
import expensetracker.common.json._
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import io.circe.generic.auto._
import mongo4cats.circe._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}

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
    private val collection: MongoCollectionF[TransactionEntity]
) extends TransactionRepository[F] {

  override def create(tx: CreateTransaction): F[TransactionId] = {
    val create = TransactionEntity.create(tx)
    collection
      .insertOne[F](create)
      .as(TransactionId(create._id.toHexString))
  }

  override def getAll(aid: UserId): F[List[Transaction]] =
    collection
      .find(Filters.and(accIdEq(aid), notHidden))
      .all[F]
      .map(_.map(_.toDomain).toList)

  override def get(aid: UserId, txid: TransactionId): F[Transaction] =
    collection
      .find(Filters.and(accIdEq(aid), idEq(txid.value)))
      .first[F]
      .flatMap(errorIfNull(TransactionDoesNotExist(txid)))
      .map(_.toDomain)

  override def update(tx: Transaction): F[Unit] =
    collection
      .findOneAndReplace[F](
        Filters.and(accIdEq(tx.userId), idEq(tx.id.value)),
        TransactionEntity.from(tx)
      )
      .flatMap(errorIfNull(TransactionDoesNotExist(tx.id)))
      .void

  override def delete(aid: UserId, txid: TransactionId): F[Unit] =
    collection
      .findOneAndDelete[F](Filters.and(accIdEq(aid), idEq(txid.value)))
      .flatMap(errorIfNull(TransactionDoesNotExist(txid)))
      .void

  override def hide(aid: UserId, txid: TransactionId, hidden: Boolean): F[Unit] =
    collection
      .updateOne(Filters.and(accIdEq(aid), idEq(txid.value)), Updates.set(HiddenField, hidden))
      .flatMap(errorIfNoMatches(TransactionDoesNotExist(txid)))

  override def isHidden(aid: UserId, txid: TransactionId): F[Boolean] =
    collection
      .count(Filters.and(accIdEq(aid), idEq(txid.value), Filters.eq(HiddenField, true)))
      .map(_ > 0)
}

object TransactionRepository {

  def make[F[_]: Async](db: MongoDatabaseF[F]): F[TransactionRepository[F]] =
    db.getCollectionWithCirceCodecs[TransactionEntity]("transactions")
      .map(coll => new LiveTransactionRepository[F](coll))
}
