package expensetracker

import cats.effect.{IO, IOApp}
import expensetracker.account.Accounts
import expensetracker.auth.Auth
import expensetracker.category.Categories
import expensetracker.common.actions.{Action, ActionDispatcher, ActionProcessor}
import expensetracker.common.config.AppConfig
import expensetracker.common.web.Http
import expensetracker.health.Health
import expensetracker.sync.Sync
import expensetracker.transaction.{PeriodicTransactions, Transactions}
import expensetracker.wellknown.WellKnown
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
          wellKnown  <- WellKnown.make[IO](config.wellKnown)
          auth       <- Auth.make(config.auth, res, dispatcher)
          accs       <- Accounts.make(res, dispatcher)
          cats       <- Categories.make(res, dispatcher)
          txs        <- Transactions.make(res)
          ptxs       <- PeriodicTransactions.make(res, dispatcher)
          sync       <- Sync.make(res, dispatcher)
          http       <- Http.make(health, wellKnown, auth, cats, txs, ptxs, accs, sync)
          processor  <- ActionProcessor.make[IO](dispatcher, auth.userService, cats.service, txs.service, ptxs.service, accs.service)
          _          <- dispatcher.dispatch(Action.SchedulePeriodicTransactionRecurrenceGeneration)
          _ <- logger.info("starting http server") >> http
            .serve(config.server)
            .concurrently(processor.run)
            .compile
            .drain
        yield ()
      }
    yield ()
