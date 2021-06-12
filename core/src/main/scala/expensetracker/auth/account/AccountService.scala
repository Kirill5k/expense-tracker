package expensetracker.auth.account

import cats.MonadError
import cats.implicits._
import expensetracker.auth.account.db.AccountRepository
import expensetracker.common.errors.AppError.InvalidEmailOrPassword

trait AccountService[F[_]] {
  def create(email: AccountEmail, password: Password): F[AccountId]
  def login(email: AccountEmail, password: Password): F[Unit]
}

final private class LiveAccountService[F[_]](
    private val repository: AccountRepository[F],
    private val passwordEncryptor: PasswordEncryptor[F]
)(implicit
    F: MonadError[F, Throwable]
) extends AccountService[F] {

  override def create(email: AccountEmail, password: Password): F[AccountId] =
    passwordEncryptor.hash(password).flatMap(h => repository.create(email, h))

  override def login(email: AccountEmail, password: Password): F[Unit] =
    repository
      .find(email)
      .flatMap(_.fold(false.pure[F])(a => passwordEncryptor.isValid(password, a.password)))
      .flatMap {
        case true  => ().pure[F]
        case false => InvalidEmailOrPassword.raiseError[F, Unit]
      }
}

object AccountService {
  def make[F[_]](repo: AccountRepository[F], encr: PasswordEncryptor[F])(implicit
      F: MonadError[F, Throwable]
  ): F[AccountService[F]] =
    F.pure(new LiveAccountService[F](repo, encr))

}
