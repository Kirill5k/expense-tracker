package expensetracker.openapi

import cats.effect.Async
import expensetracker.auth.AuthController
import expensetracker.category.CategoryController
import expensetracker.transaction.TransactionController
import org.http4s.HttpRoutes
import sttp.tapir.openapi.Info
import sttp.tapir.docs.openapi.OpenAPIDocsInterpreter
import sttp.tapir.server.http4s.Http4sServerInterpreter
import sttp.tapir.swagger.SwaggerUI
import sttp.tapir.openapi.circe.yaml.*

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
    TransactionController.getAllTransactionsEndpoint,
    TransactionController.getTransactionByIdEndpoint,
    TransactionController.createTransactionEndpoint,
    TransactionController.updateTransactionEndpoint,
    TransactionController.hideTransactionEndpoint,
    TransactionController.deleteTransactionEndpoint
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
