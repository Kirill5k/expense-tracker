package expensetracker

import cats.effect.{IO, IOApp}
import com.comcast.ip4s.*
import expensetracker.auth.Auth
import expensetracker.category.Categories
import expensetracker.common.actions.{ActionDispatcher, ActionProcessor}
import expensetracker.common.config.AppConfig
import expensetracker.common.web.{Http, Server}
import expensetracker.health.Health
import expensetracker.transaction.Transactions
import org.http4s.ember.server.EmberServerBuilder
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger
import fs2.Stream

object Application extends IOApp.Simple:
  given log: Logger[IO] = Slf4jLogger.getLogger[IO]
  override val run: IO[Unit] =
    for
      config <- AppConfig.load[IO]
      _ <- Resources.make[IO](config).use { res =>
        for
          dispatcher <- ActionDispatcher.make[IO]
          health     <- Health.make[IO]
          auth       <- Auth.make(config.auth, res, dispatcher)
          cats       <- Categories.make(res)
          txs        <- Transactions.make(res)
          http       <- Http.make(health, auth, cats, txs)
          processor  <- ActionProcessor.make[IO](dispatcher, cats.service)
          _ <- http
            .serve(config.server)
            .concurrently(processor.run)
            .compile
            .drain
        yield ()
      }
    yield ()
