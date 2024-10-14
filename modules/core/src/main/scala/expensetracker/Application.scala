package expensetracker

import cats.effect.{IO, IOApp}
import expensetracker.auth.Auth
import expensetracker.category.Categories
import expensetracker.common.actions.{ActionDispatcher, ActionProcessor}
import expensetracker.common.config.AppConfig
import expensetracker.common.web.Http
import expensetracker.health.Health
import expensetracker.sync.Sync
import expensetracker.transaction.Transactions
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

object Application extends IOApp.Simple:
  given logger: Logger[IO] = Slf4jLogger.getLogger[IO]
  override val run: IO[Unit] =
    for
      _      <- logger.info(s"starting expense-tracker-core ${sys.env.getOrElse("VERSION", "")}")
      config <- logger.info("initialising config") >> AppConfig.load[IO]
      _ <- Resources.make[IO](config).use { res =>
        for
          _          <- logger.info("created resources")
          dispatcher <- ActionDispatcher.make[IO]
          health     <- Health.make[IO]
          auth       <- Auth.make(config.auth, res, dispatcher)
          cats       <- Categories.make(res, dispatcher)
          txs        <- Transactions.make(res)
          sync       <- Sync.make(res)
          http       <- Http.make(health, auth, cats, txs, sync)
          processor  <- ActionProcessor.make[IO](dispatcher, cats.service, txs.service)
          _ <- logger.info("starting http server") >> http
            .serve(config.server)
            .concurrently(processor.run)
            .compile
            .drain
        yield ()
      }
    yield ()
