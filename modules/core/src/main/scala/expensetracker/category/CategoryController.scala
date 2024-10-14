package expensetracker.category

import cats.Monad
import cats.effect.Async
import cats.syntax.applicative.*
import cats.syntax.flatMap.*
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.MatchesRegex
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.Authenticator
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryController.*
import expensetracker.common.errors.AppError.IdMismatch
import expensetracker.common.validations.*
import expensetracker.common.web.{Controller, TapirJson, TapirSchema}
import io.circe.Codec
import io.circe.refined.*
import org.http4s.HttpRoutes
import sttp.model.StatusCode
import sttp.tapir.*

final private class CategoryController[F[_]](
    private val service: CategoryService[F]
)(using
    F: Async[F]
) extends Controller[F] {

  private def getAllCategories(using authenticator: Authenticator[F]) =
    getAllCategoriesEndpoint.withAuthenticatedSession
      .serverLogic { session => _ =>
        service
          .getAll(session.userId)
          .mapResponse(_.map(CategoryView.from))
      }

  private def getCategoryById(using authenticator: Authenticator[F]) =
    getCategoryByIdEndpoint.withAuthenticatedSession
      .serverLogic { session => cid =>
        service
          .get(session.userId, cid)
          .mapResponse(CategoryView.from)
      }

  private def createCategory(using authenticator: Authenticator[F]) =
    createCategoryEndpoint.withAuthenticatedSession
      .serverLogic { session => req =>
        service
          .create(req.toDomain(session.userId))
          .mapResponse(CategoryView.from)
      }

  private def updateCategory(using authenticator: Authenticator[F]) =
    updateCategoryEndpoint.withAuthenticatedSession
      .serverLogic { session => (cid, catView) =>
        F.ensure(catView.pure[F])(IdMismatch)(_.id.value == cid.value) >>
          service
            .update(catView.toDomain(session.userId))
            .voidResponse
      }

  private def hideCategory(using authenticator: Authenticator[F]) =
    hideCategoryEndpoint.withAuthenticatedSession
      .serverLogic { session => (cid, hideCat) =>
        service
          .hide(session.userId, cid, hideCat.hidden)
          .voidResponse
      }

  private def deleteCategory(using authenticator: Authenticator[F]) =
    deleteCategoryEndpoint.withAuthenticatedSession
      .serverLogic { session => cid =>
        service
          .delete(session.userId, cid)
          .voidResponse
      }

  def routes(using authenticator: Authenticator[F]): HttpRoutes[F] =
    Controller.serverInterpreter[F].toRoutes(
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

object CategoryController extends TapirSchema with TapirJson {

  final case class CreateCategoryRequest(
      kind: CategoryKind,
      name: NonEmptyString,
      icon: NonEmptyString,
      color: ColorString
  ) derives Codec.AsObject {
    def toDomain(aid: UserId): CreateCategory =
      CreateCategory(
        name = CategoryName(name.value),
        icon = CategoryIcon(icon.value),
        kind = kind,
        color = CategoryColor(color.value),
        userId = aid
      )
  }
  
  final case class UpdateCategoryRequest(
      id: NonEmptyString,
      kind: CategoryKind,
      name: NonEmptyString,
      icon: NonEmptyString,
      color: ColorString,
      hidden: Option[Boolean]
  ) derives Codec.AsObject {
    def toDomain(aid: UserId): Category =
      Category(
        id = CategoryId(id.value),
        kind = kind,
        name = CategoryName(name.value),
        icon = CategoryIcon(icon.value),
        color = CategoryColor(color.value),
        userId = Some(aid),
        hidden = hidden.getOrElse(false)
      )
  }

  final case class HideCategoryRequest(hidden: Boolean) derives Codec.AsObject

  final case class CategoryView(
      id: String,
      name: String,
      icon: String,
      kind: CategoryKind,
      color: String
  ) derives Codec.AsObject

  object CategoryView {
    def from(cat: Category): CategoryView =
      CategoryView(cat.id.value, cat.name.value, cat.icon.value, cat.kind, cat.color.value)
  }

  private val basePath = "categories"
  private val idPath   = basePath / path[String].validate(Controller.validId).map((s: String) => CategoryId(s))(_.value).name("cat-id")

  val getAllCategoriesEndpoint = Controller.securedEndpoint.get
    .in(basePath)
    .out(jsonBody[List[CategoryView]])
    .description("Get all categories")

  val getCategoryByIdEndpoint = Controller.securedEndpoint.get
    .in(idPath)
    .out(jsonBody[CategoryView])
    .description("Get category by id")

  val createCategoryEndpoint = Controller.securedEndpoint.post
    .in(basePath)
    .in(jsonBody[CreateCategoryRequest])
    .out(statusCode(StatusCode.Created).and(jsonBody[CategoryView]))
    .description("Create new category")

  val updateCategoryEndpoint = Controller.securedEndpoint.put
    .in(idPath)
    .in(jsonBody[UpdateCategoryRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Update existing category")

  val hideCategoryEndpoint = Controller.securedEndpoint.put
    .in(idPath / "hidden")
    .in(jsonBody[HideCategoryRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Change category display status")

  val deleteCategoryEndpoint = Controller.securedEndpoint.delete
    .in(idPath)
    .out(statusCode(StatusCode.NoContent))
    .description("Delete existing category")

  def make[F[_]: Async](service: CategoryService[F]): F[Controller[F]] =
    Monad[F].pure(CategoryController[F](service))
}
