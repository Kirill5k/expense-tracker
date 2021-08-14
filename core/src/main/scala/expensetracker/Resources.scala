package expensetracker

import cats.effect.{Async, Resource}
import expensetracker.common.config.{AppConfig, MongoConfig}
import mongo4cats.client.MongoClient
import mongo4cats.database.MongoDatabase

trait Resources[F[_]] {
  def mongo: MongoDatabase[F]
}

object Resources {

  private def mongoDb[F[_]: Async](config: MongoConfig): Resource[F, MongoDatabase[F]] =
    MongoClient
      .fromConnectionString[F](config.connectionUri)
      .evalMap(_.getDatabase("expense-tracker"))

  def make[F[_]: Async](config: AppConfig): Resource[F, Resources[F]] =
    mongoDb[F](config.mongo).map { db =>
      new Resources[F] {
        def mongo: MongoDatabase[F] = db
      }
    }
}
