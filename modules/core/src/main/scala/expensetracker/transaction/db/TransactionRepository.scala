package expensetracker.transaction.db

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.transaction.{CreateTransaction, Transaction, TransactionId}
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import expensetracker.common.effects.*
import mongo4cats.circe.MongoJsonCodecs
import mongo4cats.operations.Filter
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase

import java.time.Instant

trait TransactionRepository[F[_]] extends Repository[F]:
  def create(tx: CreateTransaction): F[TransactionId]
  def getAll(uid: UserId, from: Option[Instant], to: Option[Instant]): F[List[Transaction]]
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

  override def getAll(uid: UserId, from: Option[Instant], to: Option[Instant]): F[List[Transaction]] =
    collection
      .find(userIdEq(uid) && notHidden && dateRangeSelector(from, to))
      .sortByDesc("date")
      .all
      .mapList(_.toDomain)

  private def dateRangeSelector(from: Option[Instant], to: Option[Instant]): Filter = {
    val fromFilter = from.map(d => Filter.gte(Field.Date, d))
    val toFilter = to.map(d => Filter.lt(Field.Date, d))
    List(fromFilter, toFilter).flatten.foldLeft(Filter.empty)((acc, el) => acc && el)
  }
  
  override def get(uid: UserId, txid: TransactionId): F[Transaction] =
    collection
      .find(userIdEq(uid).and(idEq(txid.toObjectId)))
      .first
      .mapOpt(_.toDomain)
      .flatMap { maybetx =>
        F.fromOption(maybetx, TransactionDoesNotExist(txid))
      }

  override def update(tx: Transaction): F[Unit] =
    collection
      .findOneAndReplace(
        userIdEq(tx.userId) && idEq(tx.id.toObjectId),
        TransactionEntity.from(tx)
      )
      .flatMap { maybetx =>
        F.fromOption(maybetx.void, TransactionDoesNotExist(tx.id))
      }

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

  override def isHidden(uid: UserId, txid: TransactionId): F[Boolean] =
    collection
      .count(userIdEq(uid) && idEq(txid.toObjectId) && Filter.eq(Field.Hidden, true))
      .map(_ > 0)
}

object TransactionRepository extends MongoJsonCodecs:
  def make[F[_]: Async](db: MongoDatabase[F]): F[TransactionRepository[F]] =
    db.getCollectionWithCodec[TransactionEntity]("transactions")
      .map(coll => LiveTransactionRepository[F](coll))
