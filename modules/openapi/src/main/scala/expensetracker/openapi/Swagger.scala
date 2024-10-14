package expensetracker.openapi

import cats.effect.Async
import expensetracker.auth.AuthController
import expensetracker.category.CategoryController
import expensetracker.transaction.TransactionController
import org.http4s.HttpRoutes
import sttp.apispec.openapi.Info
import sttp.apispec.openapi.circe.yaml.*
import sttp.tapir.docs.openapi.OpenAPIDocsInterpreter
import sttp.tapir.server.http4s.Http4sServerInterpreter
import sttp.tapir.swagger.SwaggerUI

object Swagger {
  private val categories = List(
    CategoryController.getAllCategoriesEndpoint,
    CategoryController.getCategoryByIdEndpoint,
    CategoryController.createCategoryEndpoint,
    CategoryController.updateCategoryEndpoint,
    CategoryController.hideCategoryEndpoint,
    CategoryController.deleteCategoryEndpoint
  )

  private val transactions = List(
    TransactionController.getAllEndpoint,
    TransactionController.getByIdEndpoint,
    TransactionController.createEndpoint,
    TransactionController.updateEndpoint,
    TransactionController.hideEndpoint,
    TransactionController.deleteEndpoint
  )

  private val auth = List(
    AuthController.createUserEndpoint,
    AuthController.loginEndpoint,
    AuthController.getCurrentUserEndpoint,
    AuthController.changePasswordEndpoint,
    AuthController.updateUserSettingsEndpoint,
    AuthController.logoutEndpoint
  )

  private val allEndpoints = auth ::: categories ::: transactions

  private val apiInfo = Info("Expense-tracker", "1.0", Some("Expense-tracker API documentation"))

  def routes[F[_]: Async]: HttpRoutes[F] =
    val docsAsYaml = OpenAPIDocsInterpreter().toOpenAPI(allEndpoints, apiInfo).toYaml
    Http4sServerInterpreter[F]().toRoutes(SwaggerUI(docsAsYaml))

}
