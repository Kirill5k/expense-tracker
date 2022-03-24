package expensetracker.category

import cats.Monad
import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.applicative.*
import cats.syntax.functor.*
import cats.syntax.applicativeError.*
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.MatchesRegex
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.Authenticator
import expensetracker.auth.user.UserId
import expensetracker.auth.session.Session
import expensetracker.auth.jwt.BearerToken
import expensetracker.category.CategoryController.{CategoryView, CreateCategoryRequest, CreateCategoryResponse, HideCategoryRequest, UpdateCategoryRequest}
import expensetracker.common.errors.AppError.IdMismatch
import expensetracker.common.validations.*
import expensetracker.common.web.Controller
import io.circe.generic.auto.*
import io.circe.refined.*
import org.http4s.HttpRoutes
import sttp.model.StatusCode
import sttp.tapir.*
import sttp.tapir.server.http4s.Http4sServerInterpreter

final private class CategoryController[F[_]](
    private val service: CategoryService[F]
)(using
    F: Async[F]
) extends Controller[F] {

  private val basePath = "categories"
  private val idPath   = basePath / path[String].validate(validId).map((s: String) => CategoryId(s))(_.value)

  private def getAllCategories(using authenticator: Authenticator[F]) =
    securedEndpoint.get
      .in(basePath)
      .out(jsonBody[List[CategoryView]])
      .serverLogic { session => _ =>
        service
          .getAll(session.userId)
          .mapResponse(_.map(CategoryView.from))
      }

  private def getCategoryById(using authenticator: Authenticator[F]) =
    securedEndpoint.get
      .in(idPath)
      .out(jsonBody[CategoryView])
      .serverLogic { session => cid =>
        service
          .get(session.userId, cid)
          .mapResponse(CategoryView.from)
      }

  private def createCategory(using authenticator: Authenticator[F]) =
    securedEndpoint.post
      .in(basePath)
      .in(jsonBody[CreateCategoryRequest])
      .out(statusCode(StatusCode.Created).and(jsonBody[CreateCategoryResponse]))
      .serverLogic { session => req =>
        service
          .create(req.toDomain(session.userId))
          .mapResponse(cid => CreateCategoryResponse(cid.value))
      }

  private def updateCategory(using authenticator: Authenticator[F]) =
    securedEndpoint.put
      .in(idPath)
      .in(jsonBody[UpdateCategoryRequest])
      .out(statusCode(StatusCode.NoContent))
      .serverLogic { session => (cid, catView) =>
        F.ensure(catView.pure[F])(IdMismatch)(_.id.value == cid.value) >>
          service
            .update(catView.toDomain(session.userId))
            .voidResponse
      }

  private def hideCategory(using authenticator: Authenticator[F]) =
    securedEndpoint.put
      .in(idPath / "hidden")
      .in(jsonBody[HideCategoryRequest])
      .out(statusCode(StatusCode.NoContent))
      .serverLogic { session => (cid, hideCat) =>
        service
          .hide(session.userId, cid, hideCat.hidden)
          .voidResponse
      }

  private def deleteCategory(using authenticator: Authenticator[F]) =
    securedEndpoint.delete
      .in(idPath)
      .out(statusCode(StatusCode.NoContent))
      .serverLogic { session => cid =>
        service
          .delete(session.userId, cid)
          .voidResponse
      }

  def routes(using authenticator: Authenticator[F]): HttpRoutes[F] =
    Http4sServerInterpreter[F](Controller.serverOptions).toRoutes(
      List(
        getAllCategories,
        getCategoryById,
        createCategory,
        updateCategory,
        hideCategory,
        deleteCategory
      )
    )
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

  def make[F[_]: Async](service: CategoryService[F]): F[Controller[F]] =
    Monad[F].pure(CategoryController[F](service))
}
