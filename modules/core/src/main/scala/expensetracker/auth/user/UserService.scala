package expensetracker.auth.user

import cats.{MonadError, MonadThrow}
import cats.syntax.flatMap.*
import expensetracker.auth.user.db.UserRepository
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.common.errors.AppError

trait UserService[F[_]]:
  def create(details: UserDetails, password: Password): F[UserId]
  def login(login: Login): F[User]
  def find(uid: UserId): F[User]
  def updateSettings(uid: UserId, settings: UserSettings): F[Unit]
  def changePassword(cp: ChangePassword): F[Unit]
  def save(users: List[User]): F[Unit]

final private class LiveUserService[F[_]](
    private val repository: UserRepository[F],
    private val encryptor: PasswordEncryptor[F],
    private val dispatcher: ActionDispatcher[F]
)(using
    F: MonadError[F, Throwable]
) extends UserService[F] {

  private enum LoginResult:
    case Fail
    case Success(user: User)

  override def create(details: UserDetails, password: Password): F[UserId] =
    encryptor
      .hash(password)
      .flatMap(h => repository.create(details, h))
      .flatTap(uid => dispatcher.dispatch(Action.SetupNewUser(uid)))

  override def login(login: Login): F[User] =
    repository
      .findBy(login.email)
      .flatMap {
        case Some(acc) => F.ifF(encryptor.isValid(login.password, acc.password))(LoginResult.Success(acc), LoginResult.Fail)
        case None      => F.pure(LoginResult.Fail)
      }
      .flatMap {
        case LoginResult.Fail       => F.raiseError(AppError.InvalidEmailOrPassword)
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
        case false => F.raiseError(AppError.InvalidPassword)
        case true  => encryptor.hash(cp.newPassword)
      }
      .flatMap(repository.updatePassword(cp.id))

  override def save(users: List[User]): F[Unit] =
    repository.save(users)
}

object UserService:
  def make[F[_]](
      repo: UserRepository[F],
      encr: PasswordEncryptor[F],
      disp: ActionDispatcher[F]
  )(using
      F: MonadThrow[F]
  ): F[UserService[F]] =
    F.pure(LiveUserService[F](repo, encr, disp))
