package expensetracker.transaction

import cats.Monad
import cats.effect.Async
import cats.syntax.applicative.*
import cats.syntax.flatMap.*
import expensetracker.auth.Authenticator
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryController.CategoryView
import expensetracker.category.CategoryId
import expensetracker.common.errors.AppError.{FailedValidation, IdMismatch}
import expensetracker.common.validations.*
import expensetracker.common.web.{Controller, TapirJson, TapirSchema}
import expensetracker.transaction.PeriodicTransactionController.PeriodicTransactionView
import io.circe.Codec
import io.circe.refined.*
import org.bson.types.ObjectId
import org.http4s.HttpRoutes
import squants.market.Money
import sttp.model.StatusCode
import sttp.tapir.*

import java.time.{Instant, LocalDate}

final private class PeriodicTransactionController[F[_]](
    private val service: PeriodicTransactionService[F]
)(using
    F: Async[F]
) extends Controller[F] {

  private def validated(recurrence: RecurrencePattern): F[RecurrencePattern] =
    F.ensure(recurrence.pure[F])(FailedValidation("end date must be after start date"))(r => r.endDate.forall(_.isAfter(r.startDate)))

  private def getAllTransactions(using authenticator: Authenticator[F]) =
    PeriodicTransactionController.getAllEndpoint.withAuthenticatedSession
      .serverLogic { session => _ =>
        service
          .getAll(session.userId)
          .mapResponse(_.map(PeriodicTransactionView.from))
      }

  private def createTransaction(using authenticator: Authenticator[F]) =
    PeriodicTransactionController.createEndpoint.withAuthenticatedSession
      .serverLogic { session => req =>
        validated(req.recurrence) >>
          service
            .create(req.toDomain(session.userId))
            .mapResponse(PeriodicTransactionView.from)
      }

  private def updateTransaction(using authenticator: Authenticator[F]) =
    PeriodicTransactionController.updateEndpoint.withAuthenticatedSession
      .serverLogic { session => (txid, txView) =>
        F.ensure(txView.pure[F])(IdMismatch)(_.id.value == txid.value) >>
          validated(txView.recurrence) >>
          service
            .update(txView.toDomain(session.userId))
            .voidResponse
      }

  private def hideTransaction(using authenticator: Authenticator[F]) =
    PeriodicTransactionController.hideEndpoint.withAuthenticatedSession
      .serverLogic { session => (txid, hidetx) =>
        service
          .hide(session.userId, txid, hidetx.hidden)
          .voidResponse
      }

  def routes(using authenticator: Authenticator[F]): HttpRoutes[F] =
    Controller
      .serverInterpreter[F]
      .toRoutes(
        List(
          getAllTransactions,
          createTransaction,
          updateTransaction,
          hideTransaction
        )
      )
}

object PeriodicTransactionController extends TapirSchema with TapirJson {
  import Controller.given

  final case class CreatePeriodicTransactionRequest(
      categoryId: IdString,
      amount: Money,
      recurrence: RecurrencePattern,
      note: Option[String],
      tags: Option[List[String]]
  ) derives Codec.AsObject {
    def toDomain(aid: UserId): CreatePeriodicTransaction =
      CreatePeriodicTransaction(
        userId = aid,
        categoryId = CategoryId(categoryId.value),
        amount = amount,
        recurrence = recurrence,
        note = note.filter(_.nonEmpty),
        tags = tags.map(_.toSet.map(_.toLowerCase.replaceAll(" ", "-"))).getOrElse(Set.empty)
      )
  }

  final case class PeriodicTransactionView(
      id: String,
      categoryId: String,
      recurrence: RecurrencePattern,
      amount: Money,
      note: Option[String],
      tags: Set[String],
      category: Option[CategoryView]
  ) derives Codec.AsObject

  object PeriodicTransactionView {
    def from(tx: PeriodicTransaction): PeriodicTransactionView =
      PeriodicTransactionView(
        id = tx.id.value,
        categoryId = tx.categoryId.value,
        amount = tx.amount,
        recurrence = tx.recurrence,
        note = tx.note,
        tags = tx.tags,
        category = tx.category.map(CategoryView.from)
      )
  }

  final case class HidePeriodicTransactionRequest(hidden: Boolean) derives Codec.AsObject

  final case class UpdatePeriodicTransactionRequest(
      id: IdString,
      categoryId: IdString,
      recurrence: RecurrencePattern,
      amount: Money,
      note: Option[String],
      tags: Option[List[String]],
      hidden: Option[Boolean]
  ) derives Codec.AsObject {
    def toDomain(aid: UserId): PeriodicTransaction =
      PeriodicTransaction(
        id = TransactionId(id.value),
        categoryId = CategoryId(categoryId.value),
        userId = aid,
        amount = amount,
        recurrence = recurrence,
        note = note,
        tags = tags.map(_.toSet.map(_.trim.toLowerCase)).getOrElse(Set.empty),
        hidden = hidden.getOrElse(false)
      )
  }

  private val basePath = "periodic-transactions"
  private val idPath   = basePath / path[String].validate(Controller.validId).map((s: String) => TransactionId(s))(_.value).name("tx-id")

  val createEndpoint = Controller.securedEndpoint.post
    .in(basePath)
    .in(jsonBody[CreatePeriodicTransactionRequest])
    .out(statusCode(StatusCode.Created).and(jsonBody[PeriodicTransactionView]))
    .description("Create new periodic transaction")

  val getAllEndpoint = Controller.securedEndpoint.get
    .in(basePath)
    .out(jsonBody[List[PeriodicTransactionView]])
    .description("Get all periodic transactions")

  val getByIdEndpoint = Controller.securedEndpoint.get
    .in(idPath)
    .out(jsonBody[PeriodicTransactionView])
    .description("Get existing transaction by id")

  val updateEndpoint = Controller.securedEndpoint.put
    .in(idPath)
    .in(jsonBody[UpdatePeriodicTransactionRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Update periodic transaction")

  val hideEndpoint = Controller.securedEndpoint.put
    .in(idPath / "hidden")
    .in(jsonBody[HidePeriodicTransactionRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Change transaction display status")

  def make[F[_]: Async](service: PeriodicTransactionService[F]): F[Controller[F]] =
    Monad[F].pure(PeriodicTransactionController[F](service))
}
