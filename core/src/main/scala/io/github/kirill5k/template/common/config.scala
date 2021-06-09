package io.github.kirill5k.template.common

import pureconfig._
import pureconfig.generic.auto._

object config {

  final case class MongoConfig(
      connectionUri: String
  )

  final case class ServerConfig(
      host: String,
      port: Int
  )

  final case class AppConfig(
      server: ServerConfig,
      mongo: MongoConfig
  )

  object AppConfig {
    def load: AppConfig = ConfigSource.default.loadOrThrow[AppConfig]
  }
}
