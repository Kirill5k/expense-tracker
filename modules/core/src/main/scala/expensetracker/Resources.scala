package expensetracker

import cats.effect.{Async, Resource}
import expensetracker.common.config.{AppConfig, MongoConfig}
import mongo4cats.client.{ClientSession, MongoClient}
import mongo4cats.database.MongoDatabase

trait Resources[F[_]]:
  def mongoDb: MongoDatabase[F]
  def mongoSession: ClientSession[F]

object Resources:

  private def mongoDb[F[_]: Async](config: MongoConfig): Resource[F, (ClientSession[F], MongoDatabase[F])] =
    for
      client  <- MongoClient.fromConnectionString[F](config.connectionUri)
      session <- client.startSession
      db      <- Resource.eval(client.getDatabase(config.databaseName))
    yield session -> db

  def make[F[_]: Async](config: AppConfig): Resource[F, Resources[F]] =
    mongoDb[F](config.mongo).map { case (sess, db) =>
      new Resources[F] {
        def mongoDb: MongoDatabase[F]      = db
        def mongoSession: ClientSession[F] = sess
      }
    }
