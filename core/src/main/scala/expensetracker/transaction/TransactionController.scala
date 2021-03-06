package expensetracker.transaction

import cats.Monad
import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.applicative.*
import cats.syntax.functor.*
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.Authenticator
import expensetracker.auth.user.UserId
import expensetracker.auth.session.Session
import expensetracker.auth.jwt.BearerToken
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
import sttp.tapir.server.http4s.Http4sServerInterpreter

import java.time.LocalDate

final private class TransactionController[F[_]](
    private val service: TransactionService[F]
)(using
    F: Async[F]
) extends Controller[F] {
  import TransactionController.*

  private def getAllTransactions(using authenticator: Authenticator[F]) =
    getAllTransactionsEndpoint.withAuthenticatedSession
      .serverLogic { session => _ =>
        service
          .getAll(session.userId)
          .mapResponse(_.map(TransactionView.from))
      }

  private def getTransactionById(using authenticator: Authenticator[F]) =
    getTransactionByIdEndpoint.withAuthenticatedSession
      .serverLogic { session => txid =>
        service
          .get(session.userId, txid)
          .mapResponse(TransactionView.from)
      }

  private def createTransaction(using authenticator: Authenticator[F]) =
    createTransactionEndpoint.withAuthenticatedSession
      .serverLogic { session => req =>
        service
          .create(req.toDomain(session.userId))
          .mapResponse(txid => CreateTransactionResponse(txid.value))
      }

  private def deleteTransaction(using authenticator: Authenticator[F]) =
    deleteTransactionEndpoint.withAuthenticatedSession
      .serverLogic { session => txid =>
        service
          .delete(session.userId, txid)
          .voidResponse
      }

  private def updateTransaction(using authenticator: Authenticator[F]) =
    updateTransactionEndpoint.withAuthenticatedSession
      .serverLogic { session => (txid, txView) =>
        F.ensure(txView.pure[F])(IdMismatch)(_.id.value == txid.value) >>
          service
            .update(txView.toDomain(session.userId))
            .voidResponse
      }

  private def hideTransaction(using authenticator: Authenticator[F]) =
    hideTransactionEndpoint.withAuthenticatedSession
      .serverLogic { session => (txid, hidetx) =>
        service
          .hide(session.userId, txid, hidetx.hidden)
          .voidResponse
      }

  def routes(using authenticator: Authenticator[F]): HttpRoutes[F] =
    Http4sServerInterpreter[F](Controller.serverOptions).toRoutes(
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
      tags: Set[String]
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
        tags = tx.tags
      )
  }

  final case class HideTransactionRequest(hidden: Boolean) derives Codec.AsObject

  final case class UpdateTransactionRequest(
      id: NonEmptyString,
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

  val createTransactionEndpoint = Controller.securedEndpoint.post
    .in(basePath)
    .in(jsonBody[CreateTransactionRequest])
    .out(statusCode(StatusCode.Created).and(jsonBody[CreateTransactionResponse]))
    .description("Create new transaction")

  val getAllTransactionsEndpoint = Controller.securedEndpoint.get
    .in(basePath)
    .out(jsonBody[List[TransactionView]])
    .description("Get all transactions")

  val getTransactionByIdEndpoint = Controller.securedEndpoint.get
    .in(idPath)
    .out(jsonBody[TransactionView])
    .description("Get existing transaction by id")

  val updateTransactionEndpoint = Controller.securedEndpoint.put
    .in(idPath)
    .in(jsonBody[UpdateTransactionRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Update transaction")

  val hideTransactionEndpoint = Controller.securedEndpoint.put
    .in(idPath / "hidden")
    .in(jsonBody[HideTransactionRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Change transaction display status")

  val deleteTransactionEndpoint = Controller.securedEndpoint.delete
    .in(idPath)
    .out(statusCode(StatusCode.NoContent))
    .description("Delete existing transaction")

  def make[F[_]: Async](service: TransactionService[F]): F[Controller[F]] =
    Monad[F].pure(TransactionController[F](service))
}
