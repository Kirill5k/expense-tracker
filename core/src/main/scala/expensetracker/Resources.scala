package expensetracker

import cats.effect.{Async, Resource}
import expensetracker.common.config.{AppConfig, MongoConfig}
import mongo4cats.client.MongoClientF
import mongo4cats.database.MongoDatabaseF

trait Resources[F[_]] {
  def mongo: MongoDatabaseF[F]
}

object Resources {

  private def mongoDb[F[_]: Async](config: MongoConfig): Resource[F, MongoDatabaseF[F]] =
    MongoClientF
      .fromConnectionString[F](config.connectionUri)
      .evalMap(_.getDatabase("expense-tracker"))

  def make[F[_]: Async](config: AppConfig): Resource[F, Resources[F]] =
    mongoDb[F](config.mongo).map { db =>
      new Resources[F] {
        def mongo: MongoDatabaseF[F] = db
      }
    }
}
