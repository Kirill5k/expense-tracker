package expensetracker

import cats.Monad
import cats.effect.Async
import cats.implicits._
import expensetracker.auth.Auth
import expensetracker.category.Categories
import org.http4s._
import org.http4s.implicits._
import org.http4s.server.middleware._

import scala.concurrent.duration._

final class Http[F[_]: Async] private (
    private val auth: Auth[F],
    private val categories: Categories[F]
) {

  private val routes: HttpRoutes[F] =
    auth.routes(auth.sessionAuthMiddleware) <+>
      categories.routes(auth.sessionAuthMiddleware)

  private val middleware: HttpRoutes[F] => HttpRoutes[F] = { http: HttpRoutes[F] =>
    AutoSlash(http)
  }.andThen { http: HttpRoutes[F] =>
    CORS(http)
  }.andThen { http: HttpRoutes[F] =>
    Timeout(60.seconds)(http)
  }

  private val loggers: HttpApp[F] => HttpApp[F] = { http: HttpApp[F] =>
    RequestLogger.httpApp(true, true)(http)
  }.andThen { http: HttpApp[F] =>
    ResponseLogger.httpApp(true, true)(http)
  }

  val httpApp: HttpApp[F] = loggers(middleware(routes).orNotFound)
}

object Http {
  def make[F[_]: Async](
      auth: Auth[F],
      categories: Categories[F]
  ): F[Http[F]] = Monad[F].pure(new Http(auth, categories))
}
