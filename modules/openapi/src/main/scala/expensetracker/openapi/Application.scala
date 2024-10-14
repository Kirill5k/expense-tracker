package expensetracker.openapi

import cats.effect.{IO, IOApp}
import expensetracker.openapi.config.AppConfig
import kirill5k.common.http4s.Server

object Application extends IOApp.Simple:
  override val run: IO[Unit] =
    for
      config <- AppConfig.load[IO]
      _ <- Server.ember[IO](
        Server.Config(config.server.host, config.server.port),
        Swagger.routes[IO]
      )
    yield ()
