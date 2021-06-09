package io.github.kirill5k.template

import cats.effect.{Async, Resource}
import io.github.kirill5k.template.common.config.{AppConfig, MongoConfig}
import mongo4cats.client.MongoClientF

trait Resources[F[_]] {
  def mongoClient: MongoClientF[F]
}

object Resources {

  private def mongoClient[F[_]: Async](config: MongoConfig): Resource[F, MongoClientF[F]] =
    MongoClientF.fromConnectionString[F](config.connectionUri)

  def make[F[_]: Async](config: AppConfig): Resource[F, Resources[F]] =
    mongoClient[F](config.mongo).map { mongo =>
      new Resources[F] {
        def mongoClient: MongoClientF[F] = mongo
      }
    }
}
