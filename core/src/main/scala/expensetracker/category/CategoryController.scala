package expensetracker.category

import cats.Monad
import cats.effect.Concurrent
import cats.implicits._
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.account.AccountId
import expensetracker.auth.session.Session
import expensetracker.category.CategoryController.{CategoryView, UpdateCategoryRequest}
import expensetracker.common.errors.AppError.IdMismatch
import expensetracker.common.web.Controller
import io.circe.generic.auto._
import io.circe.refined._
import org.bson.types.ObjectId
import org.http4s.{AuthedRoutes, HttpRoutes}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.server.{AuthMiddleware, Router}
import org.typelevel.log4cats.Logger

final class CategoryController[F[_]: Logger](
    private val service: CategoryService[F]
)(implicit
    F: Concurrent[F]
) extends Controller[F] {
  private val prefixPath = "/categories"

  object CategoryIdPath {
    def unapply(cid: String): Option[CategoryId] =
      ObjectId.isValid(cid).guard[Option].as(CategoryId(cid))
  }

  private val authedRoutes: AuthedRoutes[Session, F] = AuthedRoutes.of {
    case GET -> Root as session =>
      withErrorHandling {
        service
          .getAll(session.accountId)
          .map(_.map(CategoryView.from))
          .flatMap(Ok(_))
      }
    case authReq @ PUT -> Root / CategoryIdPath(cid) as session =>
      withErrorHandling {
        for {
          catView <- F.ensure(authReq.req.as[UpdateCategoryRequest])(IdMismatch)(_.id.value == cid.value)
          _       <- service.update(catView.toDomain(session.accountId))
          res     <- NoContent()
        } yield res
      }
    case DELETE -> Root / CategoryIdPath(cid) as session =>
      withErrorHandling {
        service.delete(session.accountId, cid) *> NoContent()
      }
  }

  def routes(authMiddleware: AuthMiddleware[F, Session]): HttpRoutes[F] =
    Router(prefixPath -> authMiddleware(authedRoutes))
}

object CategoryController {

  final case class UpdateCategoryRequest(
      id: NonEmptyString,
      name: NonEmptyString,
      icon: NonEmptyString
  ) {
    def toDomain(aid: AccountId): Category =
      Category(
        id = CategoryId(id.value),
        name = CategoryName(name.value),
        icon = CategoryIcon(icon.value),
        accountId = Some(aid)
      )
  }

  final case class CategoryView(
      id: String,
      name: String,
      icon: String
  )

  object CategoryView {
    def from(cat: Category): CategoryView =
      CategoryView(cat.id.value, cat.name.value, cat.icon.value)
  }

  def make[F[_]: Concurrent: Logger](service: CategoryService[F]): F[CategoryController[F]] =
    Monad[F].pure(new CategoryController[F](service))
}
