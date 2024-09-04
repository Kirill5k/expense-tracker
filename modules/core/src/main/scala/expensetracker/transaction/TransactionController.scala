package expensetracker.transaction

import cats.Monad
import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.applicative.*
import expensetracker.auth.Authenticator
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryController.CategoryView
import expensetracker.category.CategoryId
import expensetracker.common.errors.AppError.IdMismatch
import expensetracker.common.web.{Controller, TapirJson, TapirSchema}
import expensetracker.common.validations.*
import org.bson.types.ObjectId
import io.circe.Codec
import io.circe.refined.*
import org.http4s.HttpRoutes
import squants.market.Money
import sttp.model.StatusCode
import sttp.tapir.*

import java.time.{Instant, LocalDate}

final private class TransactionController[F[_]](
    private val service: TransactionService[F]
)(using
    F: Async[F]
) extends Controller[F] {

  private def getAllTransactions(using authenticator: Authenticator[F]) =
    TransactionController.getAllEndpoint.withAuthenticatedSession
      .serverLogic { session => (from, to, expanded) =>
        val txs = expanded match
          case Some(true) => service.getAllWithCategories(session.userId, from, to)
          case _          => service.getAll(session.userId, from, to)
        txs.mapResponse(_.map(TransactionController.TransactionView.from))
      }

  private def getTransactionById(using authenticator: Authenticator[F]) =
    TransactionController.getByIdEndpoint.withAuthenticatedSession
      .serverLogic { session => txid =>
        service
          .get(session.userId, txid)
          .mapResponse(TransactionController.TransactionView.from)
      }

  private def createTransaction(using authenticator: Authenticator[F]) =
    TransactionController.createEndpoint.withAuthenticatedSession
      .serverLogic { session => req =>
        service
          .create(req.toDomain(session.userId))
          .mapResponse(txid => TransactionController.CreateTransactionResponse(txid.value))
      }

  private def deleteTransaction(using authenticator: Authenticator[F]) =
    TransactionController.deleteEndpoint.withAuthenticatedSession
      .serverLogic { session => txid =>
        service
          .delete(session.userId, txid)
          .voidResponse
      }

  private def updateTransaction(using authenticator: Authenticator[F]) =
    TransactionController.updateEndpoint.withAuthenticatedSession
      .serverLogic { session => (txid, txView) =>
        F.ensure(txView.pure[F])(IdMismatch)(_.id.value == txid.value) >>
          service
            .update(txView.toDomain(session.userId))
            .voidResponse
      }

  private def hideTransaction(using authenticator: Authenticator[F]) =
    TransactionController.hideEndpoint.withAuthenticatedSession
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
          getTransactionById,
          createTransaction,
          updateTransaction,
          hideTransaction,
          deleteTransaction
        )
      )
}

object TransactionController extends TapirSchema with TapirJson {
  import Controller.given

  final case class CreateTransactionRequest(
      kind: TransactionKind,
      categoryId: IdString,
      amount: Money,
      date: LocalDate,
      note: Option[String],
      tags: Option[List[String]]
  ) derives Codec.AsObject {
    def toDomain(aid: UserId): CreateTransaction =
      CreateTransaction(
        userId = aid,
        kind = kind,
        categoryId = CategoryId(categoryId.value),
        amount = amount,
        date = date,
        note = note.filter(_.nonEmpty),
        tags = tags.map(_.toSet.map(_.toLowerCase.replaceAll(" ", "-"))).getOrElse(Set.empty)
      )
  }

  final case class CreateTransactionResponse(id: String) derives Codec.AsObject

  final case class TransactionView(
      id: String,
      kind: TransactionKind,
      categoryId: String,
      amount: Money,
      date: LocalDate,
      note: Option[String],
      tags: Set[String],
      category: Option[CategoryView]
  ) derives Codec.AsObject

  object TransactionView {
    def from(tx: Transaction): TransactionView =
      TransactionView(
        id = tx.id.value,
        kind = tx.kind,
        categoryId = tx.categoryId.value,
        amount = tx.amount,
        date = tx.date,
        note = tx.note,
        tags = tx.tags,
        category = tx.category.map(CategoryView.from)
      )
  }

  final case class HideTransactionRequest(hidden: Boolean) derives Codec.AsObject

  final case class UpdateTransactionRequest(
      id: IdString,
      kind: TransactionKind,
      categoryId: IdString,
      amount: Money,
      date: LocalDate,
      note: Option[String],
      tags: Option[List[String]]
  ) derives Codec.AsObject {
    def toDomain(aid: UserId): Transaction =
      Transaction(
        id = TransactionId(id.value),
        kind = kind,
        categoryId = CategoryId(categoryId.value),
        userId = aid,
        amount = amount,
        date = date,
        note = note,
        tags = tags.map(_.toSet.map(_.trim.toLowerCase)).getOrElse(Set.empty)
      )
  }

  private val basePath = "transactions"
  private val idPath   = basePath / path[String].validate(Controller.validId).map((s: String) => TransactionId(s))(_.value).name("tx-id")

  private val getAllQueryParams =
    query[Option[Instant]]("from")
      .and(query[Option[Instant]]("to"))
      .and(query[Option[Boolean]]("expanded").description("When true, each returned transaction will include its respective category obj"))

  val createEndpoint = Controller.securedEndpoint.post
    .in(basePath)
    .in(jsonBody[CreateTransactionRequest])
    .out(statusCode(StatusCode.Created).and(jsonBody[CreateTransactionResponse]))
    .description("Create new transaction")

  val getAllEndpoint = Controller.securedEndpoint.get
    .in(basePath)
    .in(getAllQueryParams)
    .out(jsonBody[List[TransactionView]])
    .description("Get all transactions")

  val getByIdEndpoint = Controller.securedEndpoint.get
    .in(idPath)
    .out(jsonBody[TransactionView])
    .description("Get existing transaction by id")

  val updateEndpoint = Controller.securedEndpoint.put
    .in(idPath)
    .in(jsonBody[UpdateTransactionRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Update transaction")

  val hideEndpoint = Controller.securedEndpoint.put
    .in(idPath / "hidden")
    .in(jsonBody[HideTransactionRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Change transaction display status")

  val deleteEndpoint = Controller.securedEndpoint.delete
    .in(idPath)
    .out(statusCode(StatusCode.NoContent))
    .description("Delete existing transaction")

  def make[F[_]: Async](service: TransactionService[F]): F[Controller[F]] =
    Monad[F].pure(TransactionController[F](service))
}
