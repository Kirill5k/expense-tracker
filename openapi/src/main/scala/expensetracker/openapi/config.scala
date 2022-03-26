package expensetracker.openapi

import cats.effect.kernel.Sync
import pureconfig.*
import pureconfig.generic.derivation.default.*

object config {

  final case class ServerConfig(
      host: String,
      port: Int
  ) derives ConfigReader

  final case class AppConfig(
      server: ServerConfig
  ) derives ConfigReader

  object AppConfig {
    def load[F[_]: Sync]: F[AppConfig] =
      Sync[F].blocking(ConfigSource.default.loadOrThrow[AppConfig])
  }
}
