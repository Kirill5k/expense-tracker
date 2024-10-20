package expensetracker.sync

import cats.Monad
import cats.syntax.flatMap.*
import expensetracker.sync.db.SyncRepository
import expensetracker.auth.user.{User, UserId}
import expensetracker.category.Category
import expensetracker.common.actions.Action
import expensetracker.common.actions.ActionDispatcher
import expensetracker.transaction.Transaction

import java.time.Instant

trait SyncService[F[_]]:
  def pullChanges(uid: UserId, from: Option[Instant]): F[DataChanges]
  def pushChanges(users: List[User], cats: List[Category], txs: List[Transaction]): F[Unit]

final private class LiveSyncService[F[_]](
    private val repository: SyncRepository[F],
    private val dispatcher: ActionDispatcher[F]
)(using
    F: Monad[F]
) extends SyncService[F] {

  override def pullChanges(uid: UserId, from: Option[Instant]): F[DataChanges] =
    repository.pullChanges(uid, from)

  override def pushChanges(users: List[User], cats: List[Category], txs: List[Transaction]): F[Unit] =
    F.whenA(users.nonEmpty)(dispatcher.dispatch(Action.SaveUsers(users))) >>
      F.whenA(cats.nonEmpty)(dispatcher.dispatch(Action.SaveCategories(cats))) >>
      F.whenA(txs.nonEmpty)(dispatcher.dispatch(Action.SaveTransactions(txs)))
}

object SyncService:
  def make[F[_]: Monad](repo: SyncRepository[F], dispatcher: ActionDispatcher[F]): F[SyncService[F]] =
    Monad[F].pure(LiveSyncService[F](repo, dispatcher))
