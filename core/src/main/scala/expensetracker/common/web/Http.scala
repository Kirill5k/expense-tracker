package expensetracker.common.web

import cats.Monad
import cats.effect.Async
import cats.syntax.semigroupk.*
import expensetracker.auth.jwt.BearerToken
import expensetracker.auth.{Auth, Authenticator}
import expensetracker.category.Categories
import expensetracker.common.config.ServerConfig
import expensetracker.health.Health
import expensetracker.transaction.Transactions
import org.http4s.*
import org.http4s.implicits.*
import org.http4s.server.Router
import org.http4s.server.middleware.*

import scala.concurrent.duration.*

final class Http[F[_]: Async] private (
    private val health: Health[F],
    private val auth: Auth[F],
    private val categories: Categories[F],
    private val transactions: Transactions[F]
) {

  private val routes: HttpRoutes[F] = {
    given Authenticator[F] = auth.authenticator
    val api = auth.controller.routes <+>
      categories.controller.routes <+>
      transactions.controller.routes

    Router("/api" -> api, "/" -> health.controller.routes)
  }

  private val middleware: HttpRoutes[F] => HttpRoutes[F] = { (http: HttpRoutes[F]) => AutoSlash(http) }
    .andThen((http: HttpRoutes[F]) => CORS.policy.withAllowOriginAll.withAllowCredentials(false).apply(http))
    .andThen((http: HttpRoutes[F]) => Timeout(60.seconds)(http))

  private val loggers: HttpApp[F] => HttpApp[F] = { (http: HttpApp[F]) => RequestLogger.httpApp(true, true)(http) }
    .andThen((http: HttpApp[F]) => ResponseLogger.httpApp(true, true)(http))

  val app: HttpApp[F] = loggers(middleware(routes).orNotFound)
  
  def serve(config: ServerConfig): fs2.Stream[F, Unit] = Server.serve[F](config, app)
}

object Http:
  def make[F[_]: Async](
      health: Health[F],
      auth: Auth[F],
      cats: Categories[F],
      txs: Transactions[F]
  ): F[Http[F]] = Monad[F].pure(Http(health, auth, cats, txs))
