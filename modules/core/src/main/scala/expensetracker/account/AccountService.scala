package expensetracker.account

import cats.Monad
import cats.syntax.flatMap.*
import expensetracker.account.db.AccountRepository
import expensetracker.auth.user.UserId
import expensetracker.common.actions.{Action, ActionDispatcher}

trait AccountService[F[_]]:
  def save(accounts: List[Account]): F[Unit]
  def hide(uid: UserId, aid: AccountId, hidden: Boolean = true): F[Unit]
  def deleteAll(uid: UserId): F[Unit]

final private class LiveAccountService[F[_]](
    private val repository: AccountRepository[F],
    private val dispatcher: ActionDispatcher[F]
)(using
    F: Monad[F]
) extends AccountService[F] {

  override def save(accounts: List[Account]): F[Unit] =
    repository.save(accounts)

  override def hide(uid: UserId, aid: AccountId, hidden: Boolean = true): F[Unit] =
    repository.hide(uid, aid, hidden) >>
      dispatcher.dispatch(Action.HideTransactionsByAccount(aid, hidden))

  override def deleteAll(uid: UserId): F[Unit] =
    repository.deleteAll(uid)
}

object AccountService:
  def make[F[_]: Monad](repo: AccountRepository[F], disp: ActionDispatcher[F]): F[AccountService[F]] =
    Monad[F].pure(LiveAccountService[F](repo, disp))