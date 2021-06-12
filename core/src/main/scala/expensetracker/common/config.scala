package expensetracker.common

import pureconfig._
import pureconfig.generic.auto._

object config {

  final case class AuthConfig(
      passwordSalt: String
  )

  final case class MongoConfig(
      connectionUri: String
  )

  final case class ServerConfig(
      host: String,
      port: Int
  )

  final case class AppConfig(
      server: ServerConfig,
      auth: AuthConfig,
      mongo: MongoConfig
  )

  object AppConfig {
    def load: AppConfig = ConfigSource.default.loadOrThrow[AppConfig]
  }
}
