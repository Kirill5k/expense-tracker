package expensetracker.auth.user

import cats.MonadError
import cats.syntax.flatMap.*
import cats.syntax.applicativeError.*
import expensetracker.auth.user.db.UserRepository
import expensetracker.common.errors.AppError.{InvalidEmailOrPassword, InvalidPassword}

enum LoginResult:
  case Fail
  case Success(user: User)

trait UserService[F[_]]:
  def create(details: UserDetails, password: Password): F[UserId]
  def login(login: Login): F[User]
  def find(uid: UserId): F[User]
  def updateSettings(uid: UserId, settings: UserSettings): F[Unit]
  def changePassword(cp: ChangePassword): F[Unit]

final private class LiveUserService[F[_]](
    private val repository: UserRepository[F],
    private val encryptor: PasswordEncryptor[F]
)(using
    F: MonadError[F, Throwable]
) extends UserService[F] {

  override def create(details: UserDetails, password: Password): F[UserId] =
    encryptor.hash(password).flatMap(h => repository.create(details, h))

  override def login(login: Login): F[User] =
    repository
      .findBy(login.email)
      .flatMap {
        case Some(acc) => F.ifF(encryptor.isValid(login.password, acc.password))(LoginResult.Success(acc), LoginResult.Fail)
        case None      => F.pure(LoginResult.Fail)
      }
      .flatMap {
        case LoginResult.Fail       => InvalidEmailOrPassword.raiseError[F, User]
        case LoginResult.Success(a) => F.pure(a)
      }

  override def find(uid: UserId): F[User] =
    repository.find(uid)

  override def updateSettings(uid: UserId, settings: UserSettings): F[Unit] =
    repository.updateSettings(uid, settings)

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

object UserService:
  def make[F[_]](repo: UserRepository[F], encr: PasswordEncryptor[F])(using F: MonadError[F, Throwable]): F[UserService[F]] =
    F.pure(LiveUserService[F](repo, encr))
