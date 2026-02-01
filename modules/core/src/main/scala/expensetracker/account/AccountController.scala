package expensetracker.account

import cats.Monad
import cats.effect.Async
import cats.syntax.applicative.*
import cats.syntax.flatMap.*
import eu.timepit.refined.types.string.NonEmptyString
import expensetracker.auth.Authenticator
import expensetracker.auth.user.UserId
import expensetracker.common.errors.AppError.IdMismatch
import expensetracker.common.web.{Controller, TapirJson, TapirSchema}
import squants.market.Currency
import io.circe.Codec
import io.circe.refined.*
import org.http4s.HttpRoutes
import sttp.model.StatusCode
import sttp.tapir.*

final private class AccountController[F[_]](
    private val service: AccountService[F]
)(using
    F: Async[F]
) extends Controller[F] {
  import AccountController.*

  private def getAllAccounts(using authenticator: Authenticator[F]) =
    getAllAccountsEndpoint.withAuthenticatedSession
      .serverLogic { session => _ =>
        service
          .getAll(session.userId)
          .mapResponse(_.map(AccountView.from))
      }

  private def createAccount(using authenticator: Authenticator[F]) =
    createAccountEndpoint.withAuthenticatedSession
      .serverLogic { session => req =>
        service
          .create(req.toDomain(session.userId))
          .mapResponse(AccountView.from)
      }

  private def updateAccount(using authenticator: Authenticator[F]) =
    updateAccountEndpoint.withAuthenticatedSession
      .serverLogic { session => (cid, accView) =>
        F.ensure(accView.pure[F])(IdMismatch)(_.id.value == cid.value) >>
          service
            .update(accView.toDomain(session.userId))
            .voidResponse
      }

  private def hideAccount(using authenticator: Authenticator[F]) =
    hideAccountEndpoint.withAuthenticatedSession
      .serverLogic { session => (cid, hideAcc) =>
        service
          .hide(session.userId, cid, hideAcc.hidden)
          .voidResponse
      }

  private def deleteAccount(using authenticator: Authenticator[F]) =
    deleteAccountEndpoint.withAuthenticatedSession
      .serverLogic { session => cid =>
        service
          .delete(session.userId, cid)
          .voidResponse
      }

  def routes(using authenticator: Authenticator[F]): HttpRoutes[F] =
    Controller
      .serverInterpreter[F]
      .toRoutes(
        List(
          getAllAccounts,
          createAccount,
          updateAccount,
          hideAccount,
          deleteAccount
        )
      )
}

object AccountController extends TapirSchema with TapirJson {

  final case class CreateAccountRequest(
      name: NonEmptyString,
      currency: Currency,
      isMain: Boolean
  ) derives Codec.AsObject {
    def toDomain(uid: UserId): CreateAccount =
      CreateAccount(
        userId = uid,
        name = AccountName(name.value),
        currency = currency,
        isMain = isMain
      )
  }

  final case class UpdateAccountRequest(
      id: NonEmptyString,
      name: NonEmptyString,
      currency: Currency,
      isMain: Boolean,
      hidden: Option[Boolean]
  ) derives Codec.AsObject {
    def toDomain(uid: UserId): Account =
      Account(
        id = AccountId(id.value),
        name = AccountName(name.value),
        currency = currency,
        userId = uid,
        hidden = hidden
      )
  }

  final case class HideAccountRequest(hidden: Boolean) derives Codec.AsObject

  final case class AccountView(
      id: String,
      name: String,
      currency: Currency,
      isMain: Boolean
  ) derives Codec.AsObject

  object AccountView {
    def from(acc: Account): AccountView =
      AccountView(acc.id.value, acc.name.value, acc.currency, acc.isMain)
  }

  private val basePath = "accounts"
  private val idPath   = basePath / path[String].validate(Controller.validId).map((s: String) => AccountId(s))(_.value).name("account-id")

  val getAllAccountsEndpoint = Controller.securedEndpoint.get
    .in(basePath)
    .out(jsonBody[List[AccountView]])
    .description("Get all accounts")

  val createAccountEndpoint = Controller.securedEndpoint.post
    .in(basePath)
    .in(jsonBody[CreateAccountRequest])
    .out(statusCode(StatusCode.Created).and(jsonBody[AccountView]))
    .description("Create new account")

  val updateAccountEndpoint = Controller.securedEndpoint.put
    .in(idPath)
    .in(jsonBody[UpdateAccountRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Update existing account")

  val hideAccountEndpoint = Controller.securedEndpoint.put
    .in(idPath / "hidden")
    .in(jsonBody[HideAccountRequest])
    .out(statusCode(StatusCode.NoContent))
    .description("Change account display status")

  val deleteAccountEndpoint = Controller.securedEndpoint.delete
    .in(idPath)
    .out(statusCode(StatusCode.NoContent))
    .description("Delete existing account")

  def make[F[_]: Async](service: AccountService[F]): F[Controller[F]] =
    Monad[F].pure(AccountController[F](service))
}
