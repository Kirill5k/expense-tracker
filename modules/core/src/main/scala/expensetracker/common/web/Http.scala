package expensetracker.common.web

import cats.Monad
import cats.effect.Async
import cats.syntax.semigroupk.*
import expensetracker.account.Accounts
import expensetracker.auth.{Auth, Authenticator}
import expensetracker.category.Categories
import expensetracker.common.config.ServerConfig
import expensetracker.health.Health
import expensetracker.sync.Sync
import expensetracker.transaction.{PeriodicTransactions, Transactions}
import expensetracker.wellknown.WellKnown
import kirill5k.common.http4s.Server
import org.http4s.*
import org.http4s.server.Router
import org.http4s.server.middleware.*

import scala.concurrent.duration.*

final class Http[F[_]: Async] private (
    private val health: Health[F],
    private val wellKnown: WellKnown[F],
    private val auth: Auth[F],
    private val categories: Categories[F],
    private val transactions: Transactions[F],
    private val periodicTransactions: PeriodicTransactions[F],
    private val accounts: Accounts[F],
    private val sync: Sync[F]
) {

  private val apiRoutes: HttpRoutes[F] = {
    given Authenticator[F] = auth.authenticator
    val api = auth.controller.routes <+>
      categories.controller.routes <+>
      transactions.controller.routes <+>
      periodicTransactions.controller.routes <+>
      accounts.controller.routes <+>
      sync.controller.routes

    Router("/api" -> api)
  }

  private val coreRoutes: HttpRoutes[F] = {
    given Authenticator[F] = auth.authenticator
    val core = health.controller.routes <+>
      wellKnown.controller.routes
    Router("/" -> core)
  }

  private val middleware: HttpRoutes[F] => HttpRoutes[F] = { (http: HttpRoutes[F]) => AutoSlash(http) }
    .andThen((http: HttpRoutes[F]) => CORS.policy.withAllowOriginAll.withAllowCredentials(false).apply(http))
    .andThen((http: HttpRoutes[F]) => Timeout(60.seconds)(http))

  private val loggers: HttpRoutes[F] => HttpRoutes[F] = { (http: HttpRoutes[F]) => RequestLogger.httpRoutes(true, true)(http) }
    .andThen((http: HttpRoutes[F]) => ResponseLogger.httpRoutes(true, true)(http))

  val app: HttpRoutes[F] = loggers(middleware(apiRoutes)) <+> middleware(coreRoutes)

  def serve(config: ServerConfig): fs2.Stream[F, Unit] = Server.serveEmber(config, app)
}

object Http:
  def make[F[_]: Async](
      health: Health[F],
      wellKnown: WellKnown[F],
      auth: Auth[F],
      cats: Categories[F],
      txs: Transactions[F],
      ptxs: PeriodicTransactions[F],
      accs: Accounts[F],
      sync: Sync[F]
  ): F[Http[F]] = Monad[F].pure(Http(health, wellKnown, auth, cats, txs, ptxs, accs, sync))
