package expensetracker.category

import cats.Monad
import cats.effect.Concurrent
import cats.syntax.flatMap.*
import cats.syntax.apply.*
import cats.syntax.functor.*
import cats.syntax.alternative.*
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.MatchesRegex
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.user.UserId
import expensetracker.auth.session.Session
import expensetracker.category.CategoryController.{
  CategoryView,
  CreateCategoryRequest,
  CreateCategoryResponse,
  HideCategoryRequest,
  UpdateCategoryRequest
}
import expensetracker.common.errors.AppError.IdMismatch
import expensetracker.common.validations.*
import expensetracker.common.web.Controller
import io.circe.generic.auto.*
import io.circe.refined.*
import org.bson.types.ObjectId
import org.http4s.{AuthedRoutes, HttpRoutes}
import org.http4s.circe.CirceEntityCodec.*
import org.http4s.server.{AuthMiddleware, Router}
import org.typelevel.log4cats.Logger

final class CategoryController[F[_]: Logger](
    private val service: CategoryService[F]
)(using
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
          .getAll(session.userId)
          .map(_.map(CategoryView.from))
          .flatMap(Ok(_))
      }
    case GET -> Root / CategoryIdPath(cid) as session =>
      withErrorHandling {
        service
          .get(session.userId, cid)
          .map(CategoryView.from)
          .flatMap(Ok(_))
      }
    case authReq @ POST -> Root as session =>
      withErrorHandling {
        for {
          req <- authReq.req.as[CreateCategoryRequest]
          cid <- service.create(req.toDomain(session.userId))
          res <- Created(CreateCategoryResponse(cid.value))
        } yield res
      }
    case authReq @ PUT -> Root / CategoryIdPath(cid) as session =>
      withErrorHandling {
        for {
          catView <- F.ensure(authReq.req.as[UpdateCategoryRequest])(IdMismatch)(_.id.value == cid.value)
          _       <- service.update(catView.toDomain(session.userId))
          res     <- NoContent()
        } yield res
      }
    case authReq @ PUT -> Root / CategoryIdPath(cid) / "hidden" as session =>
      withErrorHandling {
        for {
          req <- authReq.req.as[HideCategoryRequest]
          _   <- service.hide(session.userId, cid, req.hidden)
          res <- NoContent()
        } yield res
      }
    case DELETE -> Root / CategoryIdPath(cid) as session =>
      withErrorHandling {
        service.delete(session.userId, cid) *> NoContent()
      }
  }

  def routes(authMiddleware: AuthMiddleware[F, Session]): HttpRoutes[F] =
    Router(prefixPath -> authMiddleware(authedRoutes))
}

object CategoryController {

  final case class CreateCategoryRequest(
      kind: CategoryKind,
      name: NonEmptyString,
      icon: NonEmptyString,
      color: ColorString
  ) {
    def toDomain(aid: UserId): CreateCategory =
      CreateCategory(
        name = CategoryName(name.value),
        icon = CategoryIcon(icon.value),
        kind = kind,
        color = CategoryColor(color.value),
        userId = aid
      )
  }

  final case class CreateCategoryResponse(id: String)

  final case class UpdateCategoryRequest(
      id: NonEmptyString,
      kind: CategoryKind,
      name: NonEmptyString,
      icon: NonEmptyString,
      color: ColorString
  ) {
    def toDomain(aid: UserId): Category =
      Category(
        id = CategoryId(id.value),
        kind = kind,
        name = CategoryName(name.value),
        icon = CategoryIcon(icon.value),
        color = CategoryColor(color.value),
        userId = Some(aid)
      )
  }

  final case class HideCategoryRequest(hidden: Boolean)

  final case class CategoryView(
      id: String,
      name: String,
      icon: String,
      kind: CategoryKind,
      color: String
  )

  object CategoryView {
    def from(cat: Category): CategoryView =
      CategoryView(cat.id.value, cat.name.value, cat.icon.value, cat.kind, cat.color.value)
  }

  def make[F[_]: Concurrent: Logger](service: CategoryService[F]): F[CategoryController[F]] =
    Monad[F].pure(new CategoryController[F](service))
}
