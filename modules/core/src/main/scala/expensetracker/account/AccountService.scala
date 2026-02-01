package expensetracker.account

import cats.Monad
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.account.db.AccountRepository
import expensetracker.auth.user.UserId
import expensetracker.common.actions.{Action, ActionDispatcher}
import squants.market.Currency

trait AccountService[F[_]]:
  def create(ca: CreateAccount): F[Account]
  def createDefault(uid: UserId, currency: Currency): F[Unit]
  def update(acc: Account): F[Unit]
  def getAll(uid: UserId): F[List[Account]]
  def save(accounts: List[Account]): F[Unit]
  def hide(uid: UserId, aid: AccountId, hidden: Boolean = true): F[Unit]
  def deleteAll(uid: UserId): F[Unit]
  def delete(uid: UserId, aid: AccountId): F[Unit]

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

  override def getAll(uid: UserId): F[List[Account]] =
    repository.getAll(uid)

  override def create(ca: CreateAccount): F[Account] =
    repository.create(ca)

  override def createDefault(uid: UserId, currency: Currency): F[Unit] =
    repository.create(CreateAccount(uid, AccountName("Main"), currency, isMain = true)).void

  override def update(acc: Account): F[Unit] =
    repository.update(acc)

  override def delete(uid: UserId, aid: AccountId): F[Unit] =
    repository.delete(uid, aid) >>
      dispatcher.dispatch(Action.HideTransactionsByAccount(aid, true))
}

object AccountService:
  def make[F[_]: Monad](repo: AccountRepository[F], disp: ActionDispatcher[F]): F[AccountService[F]] =
    Monad[F].pure(LiveAccountService[F](repo, disp))
