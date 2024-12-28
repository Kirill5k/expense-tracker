package expensetracker.common

import cats.effect.kernel.Sync
import kirill5k.common.http4s.Server
import pureconfig.*

object config {

  final case class WellKnownAppleConfig(
      bundleId: String,
      developerId: String
  ) derives ConfigReader

  final case class WellKnownConfig(
      apple: WellKnownAppleConfig
  ) derives ConfigReader

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
      wellKnown: WellKnownConfig,
      server: ServerConfig,
      auth: AuthConfig,
      mongo: MongoConfig
  ) derives ConfigReader

  object AppConfig {
    def load[F[_]: Sync]: F[AppConfig] =
      Sync[F].blocking(ConfigSource.default.loadOrThrow[AppConfig])
  }
}
