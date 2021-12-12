package expensetracker.transaction

import cats.Monad
import cats.effect.Concurrent
import cats.implicits.*
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.user.UserId
import expensetracker.auth.session.Session
import expensetracker.category.CategoryId
import expensetracker.common.errors.AppError.IdMismatch
import expensetracker.common.web.Controller
import expensetracker.common.validations.*
import org.bson.types.ObjectId
import io.circe.generic.auto.*
import io.circe.refined.*
import org.http4s.circe.CirceEntityCodec.*
import org.http4s.server.{AuthMiddleware, Router}
import org.http4s.{AuthedRoutes, HttpRoutes}
import org.typelevel.log4cats.Logger
import squants.market.Money

import java.time.LocalDate

final class TransactionController[F[_]: Logger](
    private val service: TransactionService[F]
)(implicit
    F: Concurrent[F]
) extends Controller[F] {
  import TransactionController.*

  private val prefixPath = "/transactions"

  object TransactionIdPath {
    def unapply(cid: String): Option[TransactionId] =
      ObjectId.isValid(cid).guard[Option].as(TransactionId(cid))
  }

  private val authedRoutes: AuthedRoutes[Session, F] = AuthedRoutes.of {
    case GET -> Root as session =>
      withErrorHandling {
        service
          .getAll(session.userId)
          .map(_.map(TransactionView.from))
          .flatMap(Ok(_))
      }
    case GET -> Root / TransactionIdPath(txid) as session =>
      withErrorHandling {
        service
          .get(session.userId, txid)
          .map(TransactionView.from)
          .flatMap(Ok(_))
      }
    case authReq @ POST -> Root as session =>
      withErrorHandling {
        for {
          req <- authReq.req.as[CreateTransactionRequest]
          cid <- service.create(req.toDomain(session.userId))
          res <- Created(CreateTransactionResponse(cid.value))
        } yield res
      }
    case DELETE -> Root / TransactionIdPath(txid) as session =>
      withErrorHandling {
        service.delete(session.userId, txid) *> NoContent()
      }
    case authReq @ PUT -> Root / TransactionIdPath(cid) / "hidden" as session =>
      withErrorHandling {
        for {
          req <- authReq.req.as[HideTransactionRequest]
          _   <- service.hide(session.userId, cid, req.hidden)
          res <- NoContent()
        } yield res
      }
    case authReq @ PUT -> Root / TransactionIdPath(cid) as session =>
      withErrorHandling {
        for {
          txView <- F.ensure(authReq.req.as[UpdateTransactionRequest])(IdMismatch)(_.id.value == cid.value)
          _      <- service.update(txView.toDomain(session.userId))
          res    <- NoContent()
        } yield res
      }
  }

  def routes(authMiddleware: AuthMiddleware[F, Session]): HttpRoutes[F] =
    Router(prefixPath -> authMiddleware(authedRoutes))
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

  def make[F[_]: Concurrent: Logger](service: TransactionService[F]): F[TransactionController[F]] =
    Monad[F].pure(new TransactionController[F](service))
}
