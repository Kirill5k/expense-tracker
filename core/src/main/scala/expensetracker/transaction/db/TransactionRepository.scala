package expensetracker.transaction.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.{Aggregates, Filters, Projections}
import expensetracker.transaction.{CreateTransaction, Transaction}
import expensetracker.user.UserId
import io.circe.generic.auto._
import mongo4cats.client.MongoClientF
import mongo4cats.circe._
import mongo4cats.database.MongoCollectionF
import org.bson.types.ObjectId

trait TransactionRepository[F[_]] {
  def create(tx: CreateTransaction): F[Unit]
  def getAll(userId: UserId): F[List[Transaction]]
}

final private class LiveTransactionRepository[F[_]: Async](
    private val collection: MongoCollectionF[TransactionEntity]
) extends TransactionRepository[F] {

  override def create(tx: CreateTransaction): F[Unit] =
    collection.insertOne[F](TransactionEntity.create(tx)).void

  override def getAll(userId: UserId): F[List[Transaction]] =
    collection
      .aggregate(List(
        Aggregates.`match`(Filters.eq("userId", new ObjectId(userId.value))),
        Aggregates.lookup("categories", "categoryId", "id", "category"),
        Aggregates.unwind("category"),
        Aggregates.project(Projections.exclude("categoryId"))
      ))
}

object TransactionRepository {

  def make[F[_]: Async](client: MongoClientF[F]): F[TransactionRepository[F]] =
    client
      .getDatabase("expense-tracker")
      .flatMap(_.getCollectionWithCirceCodecs[TransactionEntity]("transactions"))
      .map(coll => new LiveTransactionRepository[F](coll))
}
