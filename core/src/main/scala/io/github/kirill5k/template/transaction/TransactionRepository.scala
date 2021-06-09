package io.github.kirill5k.template.transaction

import cats.Monad
import io.github.kirill5k.template.user.UserId
import mongo4cats.client.MongoClientF

trait TransactionRepository[F[_]] {
  def getAll(userId: UserId): F[List[Transaction]]
}

object TransactionRepository {

  def make[F[_]: Monad](client: MongoClientF[F]): F[TransactionRepository[F]] = ???
}
