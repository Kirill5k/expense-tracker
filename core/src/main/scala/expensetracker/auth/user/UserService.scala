package expensetracker.auth.user

import cats.MonadError
import cats.implicits._
import expensetracker.auth.user.db.UserRepository
import expensetracker.common.errors.AppError.{InvalidEmailOrPassword, InvalidPassword}

enum LoginResult:
  case Fail extends LoginResult
  case Success(user: User) extends LoginResult

trait UserService[F[_]]:
  def create(details: UserDetails, password: Password): F[UserId]
  def login(email: UserEmail, password: Password): F[User]
  def find(aid: UserId): F[User]
  def updateSettings(aid: UserId, settings: UserSettings): F[Unit]
  def changePassword(cp: ChangePassword): F[Unit]

final private class LiveUserService[F[_]](
    private val repository: UserRepository[F],
    private val encryptor: PasswordEncryptor[F]
)(implicit
    F: MonadError[F, Throwable]
) extends UserService[F] {

  override def create(details: UserDetails, password: Password): F[UserId] =
    encryptor.hash(password).flatMap(h => repository.create(details, h))

  override def login(email: UserEmail, password: Password): F[User] =
    repository
      .findBy(email)
      .flatMap {
        case Some(acc) => encryptor.isValid(password, acc.password).map(if (_) LoginResult.Success(acc) else LoginResult.Fail)
        case None      => F.pure(LoginResult.Fail)
      }
      .flatMap {
        case LoginResult.Fail       => InvalidEmailOrPassword.raiseError[F, User]
        case LoginResult.Success(a) => F.pure(a)
      }

  override def find(aid: UserId): F[User] =
    repository.find(aid)

  override def updateSettings(aid: UserId, settings: UserSettings): F[Unit] =
    repository.updateSettings(aid, settings)

  override def changePassword(cp: ChangePassword): F[Unit] =
    repository
      .find(cp.id)
      .flatMap(acc => encryptor.isValid(cp.currentPassword, acc.password))
      .flatMap {
        case false => InvalidPassword.raiseError[F, PasswordHash]
        case true  => encryptor.hash(cp.newPassword)
      }
      .flatMap(repository.updatePassword(cp.id))

}

object UserService {
  def make[F[_]](repo: UserRepository[F], encr: PasswordEncryptor[F])(implicit
      F: MonadError[F, Throwable]
  ): F[UserService[F]] =
    F.pure(new LiveUserService[F](repo, encr))

}
