package io.github.kirill5k.template.transaction.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.Filters
import io.circe.generic.auto._
import io.github.kirill5k.template.transaction.{CreateTransaction, Transaction}
import io.github.kirill5k.template.user.UserId
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
//    collection
//      .find(Filters.eq("userId", new ObjectId(userId.value)))
//      .projection()
      ???
}

object TransactionRepository {

  def make[F[_]: Async](client: MongoClientF[F]): F[TransactionRepository[F]] =
    client
      .getDatabase("expense-tracker")
      .flatMap(_.getCollectionWithCirceCodecs[TransactionEntity]("transactions"))
      .map(coll => new LiveTransactionRepository[F](coll))
}
