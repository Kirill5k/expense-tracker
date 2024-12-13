package expensetracker.sync

import cats.Monad
import cats.effect.Async
import cats.syntax.flatMap.*
import expensetracker.auth.Authenticator
import expensetracker.auth.user.{PasswordHash, User, UserEmail, UserId, UserName, UserSettings}
import expensetracker.category.{Category, CategoryColor, CategoryIcon, CategoryId, CategoryKind, CategoryName}
import expensetracker.common.errors.AppError
import expensetracker.common.web.{Controller, TapirJson, TapirSchema}
import expensetracker.sync.SyncController.{WatermelonDataChanges, WatermelonPullResponse}
import expensetracker.transaction.{PeriodicTransaction, RecurrenceFrequency, RecurrencePattern, Transaction, TransactionId}
import eu.timepit.refined.numeric.Positive
import eu.timepit.refined.refineV
import io.circe.Codec
import io.circe.generic.semiauto.deriveCodec
import org.http4s.HttpRoutes
import org.typelevel.log4cats.Logger
import squants.market.{defaultMoneyContext, Currency, Money}
import sttp.model.StatusCode
import sttp.tapir.*

import java.time.{Instant, LocalDate}

final private class SyncController[F[_]](
    private val service: SyncService[F]
)(using
    F: Async[F],
    logger: Logger[F]
) extends Controller[F] {

  private def pullChanges(using authenticator: Authenticator[F]) =
    SyncController.pullChangesEndpoint.withAuthenticatedSession
      .serverLogic { sess => lastPulledAt =>
        service
          .pullChanges(sess.userId, lastPulledAt.map(Instant.ofEpochMilli))
          .mapResponse { dc =>
            WatermelonPullResponse(
              changes = WatermelonDataChanges.from(dc),
              timestamp = dc.time.toEpochMilli
            )
          }
      }

  private def pushChanges(using authenticator: Authenticator[F]) =
    SyncController.pushChangesEndpoint.withAuthenticatedSession
      .serverLogic { sess => (lastPulledAt, changes) =>
        val ts = lastPulledAt.map(Instant.ofEpochMilli)

        val updatedUsers = changes.users.updated.filter(_.id == sess.userId).map(_.toDomain(ts))
        val createdCats  = changes.categories.created.filter(_.user_id == sess.userId).map(_.toDomain(ts, ts))
        val updatedCats  = changes.categories.updated.filter(_.user_id == sess.userId).map(_.toDomain(None, ts))
        val createdTxs   = changes.transactions.created.filter(_.user_id == sess.userId).map(_.toDomain(ts, ts))
        val updatedTxs   = changes.transactions.updated.filter(_.user_id == sess.userId).map(_.toDomain(None, ts))
        val createdPtxs  = changes.periodic_transactions.created.filter(_.user_id == sess.userId).map(_.toDomain(ts, ts))
        val updatedPtxs  = changes.periodic_transactions.updated.filter(_.user_id == sess.userId).map(_.toDomain(None, ts))

        val users = updatedUsers.flatMap(_.toOption)
        val cats  = createdCats ::: updatedCats
        val txs   = createdTxs.flatMap(_.toOption) ::: updatedTxs.flatMap(_.toOption)
        val ptxs  = createdPtxs.flatMap(_.toOption) ::: updatedPtxs.flatMap(_.toOption)

        logger.info(
          s"Push changes for ${sess.userId} at $ts: ${changes.summary}. Valid data: " +
            s"users - ${users.size} | " +
            s"categories - ${cats.size} | " +
            s"transactions - ${txs.size} | " +
            s"periodicTransactions - ${ptxs.size}"
        ) >>
          service.pushChanges(users, cats, txs, ptxs).voidResponse
      }

  override def routes(using authenticator: Authenticator[F]): HttpRoutes[F] =
    Controller
      .serverInterpreter[F]
      .toRoutes(List(pullChanges, pushChanges))
}

object SyncController extends TapirSchema with TapirJson {
  given Schema[WatermelonDataChanges] = Schema.string

  private val basePath       = "sync"
  private val watermelonPath = basePath / "watermelon"

  final case class WatermelonState(
      id: String,
      user_id: Option[UserId]
  ) derives Codec.AsObject

  final case class WatermelonUser(
      id: UserId,
      first_name: String,
      last_name: String,
      email: String,
      settings_currency_code: String,
      settings_currency_symbol: String,
      settings_future_transaction_visibility_days: Option[Int],
      settings_dark_mode: Option[Boolean],
      registration_date: Instant
  ) derives Codec.AsObject {
    def toDomain(lastUpdatedAt: Option[Instant]): Either[AppError, User] =
      Currency(settings_currency_code)(defaultMoneyContext).toEither.left
        .map(e => AppError.FailedValidation(s"Invalid currency code $settings_currency_code"))
        .map { currency =>
          User(
            id = id,
            email = UserEmail(email),
            name = UserName(first_name, last_name),
            password = PasswordHash(""),
            settings = UserSettings(currency, false, settings_dark_mode, settings_future_transaction_visibility_days),
            registrationDate = registration_date,
            categories = None,
            totalTransactionCount = None,
            lastUpdatedAt = lastUpdatedAt
          )
        }
  }

  object WatermelonUser:
    def from(u: User): WatermelonUser =
      WatermelonUser(
        id = u.id,
        first_name = u.name.first,
        last_name = u.name.last,
        email = u.email.value,
        settings_currency_code = u.settings.currency.code,
        settings_currency_symbol = u.settings.currency.symbol,
        settings_future_transaction_visibility_days = u.settings.futureTransactionVisibilityDays,
        settings_dark_mode = u.settings.darkMode,
        registration_date = u.registrationDate
      )

  final case class WatermelonCategory(
      id: CategoryId,
      name: String,
      icon: String,
      kind: CategoryKind,
      color: String,
      hidden: Boolean,
      user_id: UserId
  ) derives Codec.AsObject {
    def toDomain(createdAt: Option[Instant], lastUpdatedAt: Option[Instant]): Category =
      Category(
        id = id,
        kind = kind,
        name = CategoryName(name),
        icon = CategoryIcon(icon),
        color = CategoryColor(color),
        userId = Some(user_id),
        hidden = hidden,
        createdAt = createdAt,
        lastUpdatedAt = lastUpdatedAt
      )
  }

  object WatermelonCategory:
    def from(cat: Category): WatermelonCategory =
      WatermelonCategory(
        id = cat.id,
        name = cat.name.value,
        icon = cat.icon.value,
        kind = cat.kind,
        color = cat.color.value,
        hidden = cat.hidden,
        user_id = cat.userId.get
      )

  final case class WatermelonTransaction(
      id: TransactionId,
      category_id: CategoryId,
      parent_transaction_id: Option[TransactionId],
      is_recurring: Option[Boolean],
      amount_value: Double,
      amount_currency_code: String,
      amount_currency_symbol: String,
      date: LocalDate,
      note: Option[String],
      tags: Option[String],
      hidden: Boolean,
      user_id: UserId
  ) derives Codec.AsObject {
    def toDomain(createdAt: Option[Instant], lastUpdatedAt: Option[Instant]): Either[AppError, Transaction] =
      Currency(amount_currency_code)(defaultMoneyContext).toEither.left
        .map(e => AppError.FailedValidation(s"Invalid currency code $amount_currency_code"))
        .map { currency =>
          Transaction(
            id = id,
            userId = user_id,
            categoryId = category_id,
            parentTransactionId = parent_transaction_id,
            isRecurring = is_recurring.getOrElse(false),
            amount = Money(amount_value, currency),
            date = date,
            note = note,
            tags = tags.fold(Set.empty)(t => t.split(",").toSet),
            hidden = hidden,
            category = None,
            createdAt = createdAt,
            lastUpdatedAt = lastUpdatedAt
          )
        }
  }

  object WatermelonTransaction:
    def from(tx: Transaction): WatermelonTransaction =
      WatermelonTransaction(
        id = tx.id,
        category_id = tx.categoryId,
        parent_transaction_id = tx.parentTransactionId,
        is_recurring = Some(tx.isRecurring),
        amount_value = tx.amount.value,
        amount_currency_code = tx.amount.currency.code,
        amount_currency_symbol = tx.amount.currency.symbol,
        date = tx.date,
        note = tx.note,
        tags = Option.when(tx.tags.nonEmpty)(tx.tags.mkString(",")),
        hidden = tx.hidden,
        user_id = tx.userId
      )

  final case class WatermelonPeriodicTransaction(
      id: TransactionId,
      category_id: CategoryId,
      amount_value: Double,
      amount_currency_code: String,
      amount_currency_symbol: String,
      recurrence_start_date: LocalDate,
      recurrence_next_date: Option[LocalDate],
      recurrence_end_date: Option[LocalDate],
      recurrence_interval: Int,
      recurrence_frequency: RecurrenceFrequency,
      note: Option[String],
      tags: Option[String],
      hidden: Boolean,
      user_id: UserId
  ) derives Codec.AsObject {
    def toDomain(createdAt: Option[Instant], lastUpdatedAt: Option[Instant]): Either[AppError, PeriodicTransaction] =
      Currency(amount_currency_code)(defaultMoneyContext).toEither.left
        .map(e => AppError.FailedValidation(s"Invalid currency code $amount_currency_code"))
        .map { currency =>
          PeriodicTransaction(
            id = id,
            userId = user_id,
            categoryId = category_id,
            recurrence = RecurrencePattern(
              startDate = recurrence_start_date,
              nextDate = recurrence_next_date,
              endDate = recurrence_end_date,
              interval = refineV[Positive].unsafeFrom(Option(recurrence_interval).filter(_ > 0).getOrElse(1)),
              frequency = recurrence_frequency
            ),
            amount = Money(amount_value, currency),
            note = note,
            tags = tags.fold(Set.empty)(t => t.split(",").toSet),
            hidden = hidden,
            category = None,
            createdAt = createdAt,
            lastUpdatedAt = lastUpdatedAt
          )
        }
  }

  object WatermelonPeriodicTransaction:
    def from(tx: PeriodicTransaction): WatermelonPeriodicTransaction =
      WatermelonPeriodicTransaction(
        id = tx.id,
        category_id = tx.categoryId,
        recurrence_start_date = tx.recurrence.startDate,
        recurrence_next_date = tx.recurrence.nextDate,
        recurrence_end_date = tx.recurrence.endDate,
        recurrence_frequency = tx.recurrence.frequency,
        recurrence_interval = tx.recurrence.interval.value,
        amount_value = tx.amount.value,
        amount_currency_code = tx.amount.currency.code,
        amount_currency_symbol = tx.amount.currency.symbol,
        note = tx.note,
        tags = Option.when(tx.tags.nonEmpty)(tx.tags.mkString(",")),
        hidden = tx.hidden,
        user_id = tx.userId
      )

  final case class WatermelonDataChange[A](
      created: List[A],
      updated: List[A],
      deleted: List[A]
  )

  object WatermelonDataChange:
    given [A](using ca: Codec[A]): Codec[WatermelonDataChange[A]] = deriveCodec[WatermelonDataChange[A]]

  final case class WatermelonDataChanges(
      state: WatermelonDataChange[WatermelonState],
      transactions: WatermelonDataChange[WatermelonTransaction],
      categories: WatermelonDataChange[WatermelonCategory],
      users: WatermelonDataChange[WatermelonUser],
      periodic_transactions: WatermelonDataChange[WatermelonPeriodicTransaction]
  ) derives Codec.AsObject {

    def summary: String =
      s"""state - ${state.created.size}/${state.updated.size}/${state.deleted.size} |""" +
        s"""users - ${users.created.size}/${users.updated.size}/${users.deleted.size} |""" +
        s"""categories - ${categories.created.size}/${categories.updated.size}/${categories.deleted.size} |""" +
        s"""transactions - ${transactions.created.size}/${transactions.updated.size}/${transactions.deleted.size} |""" +
        s"""periodicTransactions - ${periodic_transactions.created.size}/${periodic_transactions.updated.size}/${periodic_transactions.deleted.size}"""
  }

  object WatermelonDataChanges:
    def from(dc: DataChanges): WatermelonDataChanges =
      WatermelonDataChanges(
        state = WatermelonDataChange(
          created = Nil,
          updated = Option.when(dc.users.created.nonEmpty)(WatermelonState("expense-tracker", dc.users.created.headOption.map(_.id))).toList,
          deleted = Nil
        ),
        transactions = WatermelonDataChange(
          created = dc.transactions.created.map(WatermelonTransaction.from),
          updated = dc.transactions.updated.map(WatermelonTransaction.from),
          deleted = Nil
        ),
        categories = WatermelonDataChange(
          created = dc.categories.created.map(WatermelonCategory.from),
          updated = dc.categories.updated.map(WatermelonCategory.from),
          deleted = Nil
        ),
        users = WatermelonDataChange(
          created = dc.users.created.map(WatermelonUser.from),
          updated = dc.users.updated.map(WatermelonUser.from),
          deleted = Nil
        ),
        periodic_transactions = WatermelonDataChange(
          created = dc.periodicTransactions.created.map(WatermelonPeriodicTransaction.from),
          updated = dc.periodicTransactions.updated.map(WatermelonPeriodicTransaction.from),
          deleted = Nil
        )
      )

  final case class WatermelonPullResponse(
      changes: WatermelonDataChanges,
      timestamp: Long
  ) derives Codec.AsObject

  val queryParams = query[Option[Long]]("lastPulledAt")

  val pullChangesEndpoint = Controller.securedEndpoint.get
    .in(watermelonPath)
    .in(queryParams)
    .out(jsonBody[WatermelonPullResponse])

  val pushChangesEndpoint = Controller.securedEndpoint.post
    .in(watermelonPath)
    .in(queryParams)
    .in(jsonBody[WatermelonDataChanges])
    .out(statusCode(StatusCode.NoContent))

  def make[F[_]: Async: Logger](service: SyncService[F]): F[Controller[F]] =
    Monad[F].pure(SyncController[F](service))
}
