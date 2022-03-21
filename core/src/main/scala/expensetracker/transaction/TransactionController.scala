package expensetracker.transaction

import cats.Monad
import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.applicative.*
import cats.syntax.functor.*
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.user.UserId
import expensetracker.auth.session.Session
import expensetracker.auth.jwt.BearerToken
import expensetracker.category.CategoryId
import expensetracker.common.errors.AppError.IdMismatch
import expensetracker.common.web.{Controller, SecuredController}
import expensetracker.common.validations.*
import org.bson.types.ObjectId
import io.circe.generic.auto.*
import io.circe.refined.*
import org.http4s.HttpRoutes
import squants.market.Money
import sttp.model.StatusCode
import sttp.tapir.*
import sttp.tapir.server.http4s.Http4sServerInterpreter

import java.time.LocalDate

final class TransactionController[F[_]](
    private val service: TransactionService[F]
)(using
    F: Async[F]
) extends SecuredController[F] {
  import TransactionController.*

  private val basePath = "transactions"
  private val idPath   = basePath / path[String].map((s: String) => TransactionId(s))(_.value)

  private def getAllTransactions(auth: BearerToken => F[Session]) =
    securedEndpoint(auth).get
      .in(basePath)
      .out(jsonBody[List[TransactionView]])
      .serverLogic { session => _ =>
        service
          .getAll(session.userId)
          .mapResponse(_.map(TransactionView.from))
      }

  private def getTransactionById(auth: BearerToken => F[Session]) =
    securedEndpoint(auth).get
      .in(idPath)
      .out(jsonBody[TransactionView])
      .serverLogic { session => txid =>
        service
          .get(session.userId, txid)
          .mapResponse(TransactionView.from)
      }

  private def createTransaction(auth: BearerToken => F[Session]) =
    securedEndpoint(auth).post
      .in(basePath)
      .in(jsonBody[CreateTransactionRequest])
      .out(statusCode(StatusCode.Created).and(jsonBody[CreateTransactionResponse]))
      .serverLogic { session => req =>
        service
          .create(req.toDomain(session.userId))
          .mapResponse(txid => CreateTransactionResponse(txid.value))
      }

  private def deleteTransaction(auth: BearerToken => F[Session]) =
    securedEndpoint(auth).delete
      .in(idPath)
      .out(statusCode(StatusCode.NoContent))
      .serverLogic { session => txid =>
        service
          .delete(session.userId, txid)
          .voidResponse
      }

  private def updateTransaction(auth: BearerToken => F[Session]) =
    securedEndpoint(auth).put
      .in(idPath)
      .in(jsonBody[UpdateTransactionRequest])
      .out(statusCode(StatusCode.NoContent))
      .serverLogic { session => (txid, txView) =>
        F.ensure(txView.pure[F])(IdMismatch)(_.id.value == txid.value) >>
          service
            .update(txView.toDomain(session.userId))
            .voidResponse
      }

  private def hideTransaction(auth: BearerToken => F[Session]) =
    securedEndpoint(auth).put
      .in(idPath / "hidden")
      .in(jsonBody[HideTransactionRequest])
      .out(statusCode(StatusCode.NoContent))
      .serverLogic { session => (txid, hidetx) =>
        service
          .hide(session.userId, txid, hidetx.hidden)
          .voidResponse
      }

  def routes(auth: BearerToken => F[Session]): HttpRoutes[F] =
    Http4sServerInterpreter[F](serverOptions).toRoutes(
      List(
        getAllTransactions(auth),
        getTransactionById(auth),
        createTransaction(auth),
        updateTransaction(auth),
        hideTransaction(auth),
        deleteTransaction(auth)
      )
    )
}

object TransactionController {

  final case class CreateTransactionRequest(
      kind: TransactionKind,
      categoryId: IdString,
      amount: Money,
      date: LocalDate,
      note: Option[String],
      tags: Option[List[String]]
  ) {
    def toDomain(aid: UserId): CreateTransaction =
      CreateTransaction(
        userId = aid,
        kind = kind,
        categoryId = CategoryId(categoryId.value),
        amount = amount,
        date = date,
        note = note.filter(_.nonEmpty),
        tags = tags.map(_.toSet).getOrElse(Set.empty)
      )
  }

  final case class CreateTransactionResponse(id: String)

  final case class TransactionView(
      id: String,
      kind: TransactionKind,
      categoryId: String,
      amount: Money,
      date: LocalDate,
      note: Option[String],
      tags: Set[String]
  )

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

  final case class HideTransactionRequest(hidden: Boolean)

  final case class UpdateTransactionRequest(
      id: NonEmptyString,
      kind: TransactionKind,
      categoryId: IdString,
      amount: Money,
      date: LocalDate,
      note: Option[String],
      tags: Option[List[String]]
  ) {
    def toDomain(aid: UserId): Transaction =
      Transaction(
        id = TransactionId(id.value),
        kind = kind,
        categoryId = CategoryId(categoryId.value),
        userId = aid,
        amount = amount,
        date = date,
        note = note,
        tags = tags.map(_.toSet).getOrElse(Set.empty)
      )
  }

  def make[F[_]: Async](service: TransactionService[F]): F[TransactionController[F]] =
    Monad[F].pure(TransactionController[F](service))
}
