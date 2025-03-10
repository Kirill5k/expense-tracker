package expensetracker.accounts.db

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.accounts.{Account, AccountId, CreateAccount}
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError
import kirill5k.common.cats.syntax.applicative.*
import mongo4cats.circe.MongoJsonCodecs
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase
import mongo4cats.models.collection.WriteCommand
import mongo4cats.operations.{Filter, Update}

trait AccountRepository[F[_]] extends Repository[F]:
  def create(acc: CreateAccount): F[Account]
  def update(acc: Account): F[Unit]
  def getAll(uid: UserId): F[List[Account]]
  def delete(uid: UserId, aid: AccountId): F[Unit]
  def hide(uid: UserId, aid: AccountId, hidden: Boolean = true): F[Unit]
  def save(accs: List[Account]): F[Unit]

final private class LiveAccountRepository[F[_]](
    private val collection: MongoCollection[F, AccountEntity]
)(using
    F: Async[F]
) extends AccountRepository[F] {

  extension (acc: Account)
    private def toFilterById: Filter = userIdEq(acc.userId) && idEq(acc.id.toObjectId)
    private def toUpdate: Update = {
      var upd = Update
        .setOnInsert(Field.Id, acc.id.toObjectId)
        .setOnInsert(Field.UId, acc.userId.toObjectId)
        .set(Field.Name, acc.name)
        .set(Field.Currency, acc.currency)
        .set(Field.Hidden, acc.hidden)

      upd = acc.createdAt.fold(upd)(ts => upd.set(Field.CreatedAt, ts))
      upd = acc.lastUpdatedAt.fold(upd.currentDate(Field.LastUpdatedAt))(ts => upd.set(Field.LastUpdatedAt, ts))
      upd
    }

  override def getAll(uid: UserId): F[List[Account]] =
    collection
      .find(userIdEq(uid) && notHidden)
      .sortBy(Field.Name)
      .all
      .mapList(_.toDomain)

  override def delete(uid: UserId, aid: AccountId): F[Unit] =
    collection
      .deleteOne(userIdEq(uid) && idEq(aid.toObjectId))
      .flatMap { result =>
        F.raiseWhen(result.getDeletedCount == 0)(AppError.AccountDoesNotExist(aid))
      }

  override def hide(uid: UserId, aid: AccountId, hidden: Boolean): F[Unit] =
    collection
      .updateOne(userIdEq(uid) && idEq(aid.toObjectId), updateHidden(hidden))
      .flatMap(errorIfNoMatches(AppError.AccountDoesNotExist(aid)))

  override def create(acc: CreateAccount): F[Account] =
    val newAcc = AccountEntity.from(acc)
    countByName(collection, acc.userId, newAcc.name)
      .flatMap:
        case 0 => collection.insertOne(newAcc).as(newAcc.toDomain)
        case _ => F.raiseError(AppError.AccountAlreadyExists(acc.name))

  override def update(acc: Account): F[Unit] =
    collection
      .updateOne(acc.toFilterById, acc.toUpdate)
      .flatMap(errorIfNoMatches(AppError.AccountDoesNotExist(acc.id)))

  override def save(accs: List[Account]): F[Unit] =
    val commands = accs.map(c => WriteCommand.UpdateOne(c.toFilterById, c.toUpdate, upsertUpdateOpt))
    collection.bulkWrite(commands).void
}

object AccountRepository extends MongoJsonCodecs:
  def make[F[_] : Async](db: MongoDatabase[F]): F[AccountRepository[F]] =
    db.getCollectionWithCodec[AccountEntity]("accounts")
      .map(LiveAccountRepository[F](_))
