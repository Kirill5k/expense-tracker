package expensetracker.sync

import cats.Monad
import cats.effect.Async
import expensetracker.auth.Authenticator
import expensetracker.auth.user.{PasswordHash, User, UserEmail, UserId, UserName, UserSettings}
import expensetracker.category.{Category, CategoryColor, CategoryIcon, CategoryId, CategoryKind, CategoryName}
import expensetracker.common.errors.AppError
import expensetracker.common.validations.*
import expensetracker.common.web.{Controller, TapirJson, TapirSchema}
import expensetracker.sync.SyncController.{WatermelonDataChanges, WatermelonPullResponse}
import expensetracker.transaction.{Transaction, TransactionId}
import io.circe.Codec
import io.circe.generic.semiauto.deriveCodec
import org.http4s.HttpRoutes
import squants.market.{Currency, Money, defaultMoneyContext}
import sttp.tapir.*

import java.time.{Instant, LocalDate}

final private class SyncController[F[_]](
    private val service: SyncService[F]
)(using
    F: Async[F]
) extends Controller[F] {

  def pullChanges(using authenticator: Authenticator[F]) = SyncController.pullChangesEndpoint.withAuthenticatedSession
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

  override def routes(using authenticator: Authenticator[F]): HttpRoutes[F] =
    Controller
      .serverInterpreter[F]
      .toRoutes(List(pullChanges))
}

object SyncController extends TapirSchema with TapirJson {
  given Schema[WatermelonDataChanges] = Schema.string

  private val basePath       = "sync"
  private val watermelonPath = basePath / "watermelon"

  final case class WatermelonState() derives Codec.AsObject

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
    def toDomain: Either[AppError, User] =
      Currency(settings_currency_code)(defaultMoneyContext)
        .toEither
        .left.map(e => AppError.FailedValidation(s"Invalid currency code $settings_currency_code"))
        .map { currency =>
          User(
            id = id,
            email = UserEmail(email),
            name = UserName(first_name, last_name),
            password = PasswordHash(""),
            settings = UserSettings(currency, false, settings_dark_mode, settings_future_transaction_visibility_days),
            registrationDate = registration_date,
            categories = None,
            totalTransactionCount = None
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
    def toDomain: Category =
      Category(
        id = id,
        kind = kind,
        name = CategoryName(name),
        icon = CategoryIcon(icon),
        color = CategoryColor(color),
        userId = Some(user_id),
        hidden = hidden
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
      amount_value: Double,
      amount_currency_code: String,
      amount_currency_symbol: String,
      date: LocalDate,
      note: Option[String],
      tags: Option[String],
      hidden: Boolean,
      user_id: UserId
  ) derives Codec.AsObject {
    def toDomain: Either[AppError, Transaction] =
      Currency(amount_currency_code)(defaultMoneyContext)
        .toEither
        .left.map(e => AppError.FailedValidation(s"Invalid currency code $amount_currency_code"))
        .map { currency =>
          Transaction(
            id = id,
            userId = user_id,
            categoryId = category_id,
            amount = Money(amount_value, currency),
            date = date,
            note = note,
            tags = tags.fold(Set.empty)(t => t.split(",").toSet),
            hidden = hidden,
            category = None
          )
        }
  }

  object WatermelonTransaction:
    def from(tx: Transaction): WatermelonTransaction =
      WatermelonTransaction(
        id = tx.id,
        category_id = tx.categoryId,
        amount_value = tx.amount.value,
        amount_currency_code = tx.amount.currency.code,
        amount_currency_symbol = tx.amount.currency.symbol,
        date = tx.date,
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
      users: WatermelonDataChange[WatermelonUser]
  ) derives Codec.AsObject

  object WatermelonDataChanges:
    def from(dc: DataChanges): WatermelonDataChanges =
      WatermelonDataChanges(
        state = WatermelonDataChange(Nil, Nil, Nil),
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

  def make[F[_]: Async](service: SyncService[F]): F[Controller[F]] =
    Monad[F].pure(SyncController[F](service))
}
