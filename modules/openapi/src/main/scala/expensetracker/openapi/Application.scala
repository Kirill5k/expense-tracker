package expensetracker.openapi

import cats.effect.{IO, IOApp}
import expensetracker.Application.runtime
import expensetracker.openapi.config.AppConfig
import org.http4s.blaze.server.BlazeServerBuilder

object Application extends IOApp.Simple:
  override val run: IO[Unit] =
    for
      config <- AppConfig.load[IO]
      _ <- BlazeServerBuilder[IO]
        .withExecutionContext(runtime.compute)
        .bindHttp(config.server.port, config.server.host)
        .withHttpApp(Swagger.routes[IO].orNotFound)
        .serve
        .compile
        .drain
    yield ()
