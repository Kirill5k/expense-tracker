package expensetracker.common

import cats.effect.kernel.Sync
import kirill5k.common.http4s.Server
import pureconfig.*
import pureconfig.generic.derivation.default.*

object config {

  final case class JwtConfig(
      alg: String,
      secret: String
  ) derives ConfigReader

  final case class AuthConfig(
      passwordSalt: String,
      jwt: JwtConfig
  ) derives ConfigReader

  final case class MongoConfig(
      connectionUri: String,
      databaseName: String
  ) derives ConfigReader

  final case class ServerConfig(
      host: String,
      port: Int
  ) derives ConfigReader

  object ServerConfig {
    given Conversion[ServerConfig, Server.Config] =
      (sc: ServerConfig) => Server.Config(sc.host, sc.port)
  }

  final case class AppConfig(
      server: ServerConfig,
      auth: AuthConfig,
      mongo: MongoConfig
  ) derives ConfigReader

  object AppConfig {
    def load[F[_]: Sync]: F[AppConfig] =
      Sync[F].blocking(ConfigSource.default.loadOrThrow[AppConfig])
  }
}
