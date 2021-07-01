package expensetracker.transaction

import cats.Monad
import cats.effect.Concurrent
import cats.implicits._
import expensetracker.auth.account.AccountId
import expensetracker.auth.session.Session
import expensetracker.category.CategoryId
import expensetracker.common.web.Controller
import expensetracker.common.validations._
import org.bson.types.ObjectId
import io.circe.generic.auto._
import io.circe.refined._
import org.http4s.circe.CirceEntityCodec._
import org.http4s.server.{AuthMiddleware, Router}
import org.http4s.{AuthedRoutes, HttpRoutes}
import org.typelevel.log4cats.Logger
import squants.market.Money

import java.time.{Instant, LocalDate, ZoneOffset}

final class TransactionController[F[_]: Logger](
    private val service: TransactionService[F]
)(implicit
    F: Concurrent[F]
) extends Controller[F] {
  import TransactionController._

  private val prefixPath = "/transactions"

  object TransactionIdPath {
    def unapply(cid: String): Option[TransactionId] =
      ObjectId.isValid(cid).guard[Option].as(TransactionId(cid))
  }

  private val authedRoutes: AuthedRoutes[Session, F] = AuthedRoutes.of {
    case GET -> Root as session =>
      withErrorHandling {
        service
          .getAll(session.accountId)
          .map(_.map(TransactionView.from))
          .flatMap(Ok(_))
      }
    case GET -> Root / TransactionIdPath(txid) as session =>
      withErrorHandling {
        service
          .get(session.accountId, txid)
          .map(TransactionView.from)
          .flatMap(Ok(_))
      }
    case authReq @ POST -> Root as session =>
      withErrorHandling {
        for {
          req <- authReq.req.as[CreateTransactionRequest]
          cid <- service.create(req.toDomain(session.accountId))
          res <- Created(CreateTransactionResponse(cid.value))
        } yield res
      }
  }

  def routes(authMiddleware: AuthMiddleware[F, Session]): HttpRoutes[F] =
    Router(prefixPath -> authMiddleware(authedRoutes))
}

object TransactionController {

  final case class CreateTransactionRequest(
      kind: TransactionKind,
      categoryId: ValidIdString,
      amount: Money,
      date: LocalDate,
      note: Option[String]
  ) {
    def toDomain(aid: AccountId): CreateTransaction =
      CreateTransaction(
        accountId = aid,
        kind = kind,
        categoryId = CategoryId(categoryId.value),
        amount = amount,
        date = date.atStartOfDay().toInstant(ZoneOffset.UTC),
        note = note.filter(_.nonEmpty)
      )
  }

  final case class CreateTransactionResponse(id: String)

  final case class TransactionView(
      id: String,
      kind: TransactionKind,
      categoryId: String,
      amount: Money,
      date: Instant,
      note: Option[String]
  )

  object TransactionView {
    def from(tx: Transaction): TransactionView =
      TransactionView(
        id = tx.id.value,
        kind = tx.kind,
        categoryId = tx.categoryId.value,
        amount = tx.amount,
        date = tx.date,
        note = tx.note
      )
  }

  def make[F[_]: Concurrent: Logger](service: TransactionService[F]): F[TransactionController[F]] =
    Monad[F].pure(new TransactionController[F](service))
}