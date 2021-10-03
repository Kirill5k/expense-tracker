package expensetracker.common.web

import cats.Monad
import cats.effect.Async
import cats.implicits._
import expensetracker.auth.Auth
import expensetracker.category.Categories
import expensetracker.health.Health
import expensetracker.transaction.Transactions
import org.http4s._
import org.http4s.implicits._
import org.http4s.server.Router
import org.http4s.server.middleware._

import scala.concurrent.duration._

final class Http[F[_]: Async] private (
    private val health: Health[F],
    private val auth: Auth[F],
    private val categories: Categories[F],
    private val transactions: Transactions[F]
) {

  private val routes: HttpRoutes[F] = {
    val api = auth.routes(auth.sessionAuthMiddleware) <+>
      categories.routes(auth.sessionAuthMiddleware) <+>
      transactions.routes(auth.sessionAuthMiddleware)

    Router("/api" -> api, "/" -> health.routes)
  }

  private val middleware: HttpRoutes[F] => HttpRoutes[F] = { (http: HttpRoutes[F]) => AutoSlash(http) }
    .andThen { (http: HttpRoutes[F]) =>
      CORS.policy.withAllowOriginAll
        .withAllowCredentials(false)
        .apply(http)
    }
    .andThen((http: HttpRoutes[F]) => Timeout(60.seconds)(http))

  private val loggers: HttpApp[F] => HttpApp[F] = { (http: HttpApp[F]) => RequestLogger.httpApp(true, true)(http) }
    .andThen((http: HttpApp[F]) => ResponseLogger.httpApp(true, true)(http))

  val httpApp: HttpApp[F] = loggers(middleware(routes).orNotFound)
}

object Http {
  def make[F[_]: Async](
      health: Health[F],
      auth: Auth[F],
      cats: Categories[F],
      txs: Transactions[F]
  ): F[Http[F]] = Monad[F].pure(new Http(health, auth, cats, txs))
}
