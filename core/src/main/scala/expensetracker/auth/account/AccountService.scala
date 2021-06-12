package expensetracker.auth.account

import cats.MonadError
import cats.implicits._
import expensetracker.auth.account.db.AccountRepository
import expensetracker.common.errors.AppError.InvalidEmailOrPassword

sealed trait LoginResult
object LoginResult {
  case object Fail                           extends LoginResult
  final case class Success(account: Account) extends LoginResult
}

trait AccountService[F[_]] {
  def create(details: AccountDetails, password: Password): F[AccountId]
  def login(email: AccountEmail, password: Password): F[AccountId]
}

final private class LiveAccountService[F[_]](
    private val repository: AccountRepository[F],
    private val encryptor: PasswordEncryptor[F]
)(implicit
    F: MonadError[F, Throwable]
) extends AccountService[F] {

  import LoginResult._

  override def create(details: AccountDetails, password: Password): F[AccountId] =
    encryptor.hash(password).flatMap(h => repository.create(details, h))

  override def login(email: AccountEmail, password: Password): F[AccountId] =
    repository
      .find(email)
      .flatMap {
        case Some(acc) => encryptor.isValid(password, acc.password).map[LoginResult](if (_) Success(acc) else Fail)
        case None      => F.pure[LoginResult](Fail)
      }
      .flatMap {
        case Fail       => InvalidEmailOrPassword.raiseError[F, AccountId]
        case Success(a) => F.pure(a.id)
      }
}

object AccountService {
  def make[F[_]](repo: AccountRepository[F], encr: PasswordEncryptor[F])(implicit
      F: MonadError[F, Throwable]
  ): F[AccountService[F]] =
    F.pure(new LiveAccountService[F](repo, encr))

}
