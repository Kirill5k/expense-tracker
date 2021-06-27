package expensetracker.transaction.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.Filters
import expensetracker.transaction.{CreateTransaction, Transaction}
import expensetracker.transaction.Transaction._
import expensetracker.auth.account.AccountId
import io.circe.generic.auto._
import mongo4cats.circe._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}
import org.bson.types.ObjectId

trait TransactionRepository[F[_]] {
  def create(tx: CreateTransaction): F[Unit]
  def getAll(aid: AccountId): F[List[Transaction]]
}

final private class LiveTransactionRepository[F[_]: Async](
    private val collection: MongoCollectionF[TransactionEntity]
) extends TransactionRepository[F] {

  override def create(tx: CreateTransaction): F[Unit] =
    collection.insertOne[F](TransactionEntity.create(tx)).void

  override def getAll(aid: AccountId): F[List[Transaction]] =
    collection
      .find(Filters.eq("accountId", new ObjectId(aid.value)))
      .all[F]
      .map(_.map(_.toDomain).toList)
}

object TransactionRepository {

  def make[F[_]: Async](db: MongoDatabaseF[F]): F[TransactionRepository[F]] =
    db.getCollectionWithCirceCodecs[TransactionEntity]("transactions")
      .map(coll => new LiveTransactionRepository[F](coll))
}
