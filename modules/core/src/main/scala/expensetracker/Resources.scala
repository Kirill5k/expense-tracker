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

  private def mongoConnectionUri(c: MongoConfig): Either[Throwable, String] =
    val blank = List("user" -> c.user, "password" -> c.password, "host" -> c.host)
      .collect { case (name, value) if value.isBlank => name }
    Either.cond(
      blank.isEmpty,
      s"mongodb+srv://${c.user}:${c.password}@${c.host}/${c.dbName}",
      new IllegalArgumentException(
        s"MongoDB config is missing required fields: ${blank.mkString(", ")}. " +
          "Please set the MONGO_USER, MONGO_PASSWORD, and MONGO_HOST environment variables."
      )
    )

  private def mongoDb[F[_]: Async](config: MongoConfig): Resource[F, (ClientSession[F], MongoDatabase[F])] =
    for
      uri <- Resource.eval(Async[F].fromEither(mongoConnectionUri(config)))
      settings = MongoClientSettings
        .builder()
        .retryReads(true)
        .retryWrites(true)
        .applyConnectionString(ConnectionString(uri))
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
      db      <- Resource.eval(client.getDatabase(config.dbName))
      session <- client.startSession
    yield session -> db
  
  def make[F[_]: Async](config: AppConfig): Resource[F, Resources[F]] =
    mongoDb[F](config.mongo).map { case (sess, db) =>
      new Resources[F] {
        def mongoDb: MongoDatabase[F]      = db
        def mongoSession: ClientSession[F] = sess
      }
    }
