package expensetracker.transaction.db

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.applicative.*
import cats.syntax.functor.*
import cats.syntax.applicativeError.*
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId}
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import mongo4cats.circe.MongoJsonCodecs
import mongo4cats.collection.operations.Filter
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase

trait TransactionRepository[F[_]] extends Repository[F]:
  def create(tx: CreateTransaction): F[TransactionId]
  def getAll(uid: UserId): F[List[Transaction]]
  def get(uid: UserId, txid: TransactionId): F[Transaction]
  def delete(uid: UserId, txid: TransactionId): F[Unit]
  def update(tx: Transaction): F[Unit]
  def hide(uid: UserId, txid: TransactionId, hidden: Boolean = true): F[Unit]
  def isHidden(uid: UserId, txid: TransactionId): F[Boolean]

final private class LiveTransactionRepository[F[_]](
    private val collection: MongoCollection[F, TransactionEntity]
)(using
  F: Async[F]
) extends TransactionRepository[F] {

  override def create(tx: CreateTransaction): F[TransactionId] = {
    val create = TransactionEntity.create(tx)
    collection
      .insertOne(create)
      .as(TransactionId(create._id.toHexString))
  }

  override def getAll(uid: UserId): F[List[Transaction]] =
    collection
      .find(userIdEq(uid).and(notHidden))
      .sortByDesc("date")
      .all
      .map(_.map(_.toDomain).toList)

  override def get(uid: UserId, txid: TransactionId): F[Transaction] =
    collection
      .find(userIdEq(uid).and(idEq(txid.value)))
      .first
      .flatMap { maybetx =>
        F.fromOption(maybetx.map(_.toDomain), TransactionDoesNotExist(txid))
      }

  override def update(tx: Transaction): F[Unit] =
    collection
      .findOneAndReplace(
        userIdEq(tx.userId).and(idEq(tx.id.value)),
        TransactionEntity.from(tx)
      )
      .flatMap { maybetx =>
        F.fromOption(maybetx.void, TransactionDoesNotExist(tx.id))
      }

  override def delete(uid: UserId, txid: TransactionId): F[Unit] =
    collection
      .findOneAndDelete(userIdEq(uid).and(idEq(txid.value)))
      .flatMap { maybetx =>
        F.fromOption(maybetx.void, TransactionDoesNotExist(txid))
      }

  override def hide(uid: UserId, txid: TransactionId, hidden: Boolean): F[Unit] =
    collection
      .updateOne(userIdEq(uid).and(idEq(txid.value)), updateHidden(hidden))
      .flatMap(errorIfNoMatches(TransactionDoesNotExist(txid)))

  override def isHidden(uid: UserId, txid: TransactionId): F[Boolean] =
    collection
      .count(userIdEq(uid).and(idEq(txid.value)).and(Filter.eq(Field.Hidden, true)))
      .map(_ > 0)
}

object TransactionRepository extends MongoJsonCodecs:
  def make[F[_]: Async](db: MongoDatabase[F]): F[TransactionRepository[F]] =
    db.getCollectionWithCodec[TransactionEntity]("transactions")
      .map(coll => LiveTransactionRepository[F](coll))
