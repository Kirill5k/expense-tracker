package expensetracker.category

import cats.Monad
import cats.effect.Concurrent
import cats.implicits._
import expensetracker.auth.session.Session
import expensetracker.common.web.Controller
import org.bson.types.ObjectId
import org.http4s.{AuthedRoutes, HttpRoutes}
import org.http4s.server.{AuthMiddleware, Router}
import org.typelevel.log4cats.Logger

final class CategoryController[F[_]: Logger: Concurrent](
    private val service: CategoryService[F]
) extends Controller[F] {
  private val prefixPath = "/categories"

  object CategoryIdPath {
    def unapply(cid: String): Option[CategoryId] =
      ObjectId.isValid(cid).guard[Option].as(CategoryId(cid))
  }

  private val authedRoutes: AuthedRoutes[Session, F] = AuthedRoutes.of {
    case GET -> Root as session =>
      withErrorHandling {
        service.getAll(session.accountId)
        ???
      }
    case DELETE -> Root / CategoryIdPath(cid) as session =>
      withErrorHandling {
        service.delete(session.accountId, cid)
        ???
      }
  }

  def routes(authMiddleware: AuthMiddleware[F, Session]): HttpRoutes[F] =
    Router(prefixPath -> authMiddleware(authedRoutes))
}

object CategoryController {

  def make[F[_]: Concurrent: Logger](service: CategoryService[F]): F[CategoryController[F]] =
    Monad[F].pure(new CategoryController[F](service))
}
