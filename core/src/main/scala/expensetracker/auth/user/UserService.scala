package expensetracker.auth.user

import cats.MonadError
import cats.implicits._
import expensetracker.auth.user.db.AccountRepository
import expensetracker.common.errors.AppError.{InvalidEmailOrPassword, InvalidPassword}

sealed trait LoginResult
object LoginResult {
  case object Fail                     extends LoginResult
  final case class Success(user: User) extends LoginResult
}

trait UserService[F[_]] {
  def create(details: UserDetails, password: Password): F[UserId]
  def login(email: UserEmail, password: Password): F[User]
  def find(aid: UserId): F[User]
  def updateSettings(aid: UserId, settings: UserSettings): F[Unit]
  def changePassword(cp: ChangePassword): F[Unit]
}

final private class LiveUserService[F[_]](
    private val repository: AccountRepository[F],
    private val encryptor: PasswordEncryptor[F]
)(implicit
    F: MonadError[F, Throwable]
) extends UserService[F] {

  import LoginResult._

  override def create(details: UserDetails, password: Password): F[UserId] =
    encryptor.hash(password).flatMap(h => repository.create(details, h))

  override def login(email: UserEmail, password: Password): F[User] =
    repository
      .findBy(email)
      .flatMap {
        case Some(acc) => encryptor.isValid(password, acc.password).map[LoginResult](if (_) Success(acc) else Fail)
        case None      => F.pure[LoginResult](Fail)
      }
      .flatMap {
        case Fail       => InvalidEmailOrPassword.raiseError[F, User]
        case Success(a) => F.pure(a)
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
  def make[F[_]](repo: AccountRepository[F], encr: PasswordEncryptor[F])(implicit
      F: MonadError[F, Throwable]
  ): F[UserService[F]] =
    F.pure(new LiveUserService[F](repo, encr))

}
