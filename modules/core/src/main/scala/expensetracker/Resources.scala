package expensetracker

import cats.effect.{Async, Resource}
import expensetracker.common.config.{AppConfig, MongoConfig}
import mongo4cats.client.{ClientSession, MongoClient}
import mongo4cats.database.MongoDatabase
import mongo4cats.models.client.{ConnectionString, MongoClientSettings}

import java.util.concurrent.TimeUnit

trait Resources[F[_]]:
  def mongoDb: MongoDatabase[F]
  def mongoSession: ClientSession[F]

object Resources:

  private def mongoDb[F[_]: Async](config: MongoConfig): Resource[F, (ClientSession[F], MongoDatabase[F])] =
    for
      settings = MongoClientSettings
        .builder()
        .retryReads(true)
        .retryWrites(true)
        .applyConnectionString(ConnectionString(config.connectionUri))
        .applyToSocketSettings { builder =>
          val _ = builder
            .connectTimeout(config.connectTimeout.toMillis, TimeUnit.MILLISECONDS)
            .readTimeout(config.readTimeout.toMillis, TimeUnit.MILLISECONDS)
        }
        .applyToClusterSettings { builder =>
          val _ = builder.serverSelectionTimeout(config.serverSelectionTimeout.toMillis, TimeUnit.MILLISECONDS)
        }
        .build()
      client  <- MongoClient.create[F](settings)
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
