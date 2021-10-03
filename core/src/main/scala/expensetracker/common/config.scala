package expensetracker.common

import pureconfig.*
import pureconfig.generic.derivation.default.*

object config {

  final case class AuthConfig(
      passwordSalt: String
  ) derives ConfigReader

  final case class MongoConfig(
      connectionUri: String
  ) derives ConfigReader

  final case class ServerConfig(
      host: String,
      port: Int
  ) derives ConfigReader

  final case class AppConfig(
      server: ServerConfig,
      auth: AuthConfig,
      mongo: MongoConfig
  ) derives ConfigReader

  object AppConfig {
    def load: AppConfig = ConfigSource.default.loadOrThrow[AppConfig]
  }
}
