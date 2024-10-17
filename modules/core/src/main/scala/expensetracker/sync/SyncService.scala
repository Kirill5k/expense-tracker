package expensetracker.sync

import cats.Monad
import expensetracker.sync.db.SyncRepository
import expensetracker.auth.user.{UserId, User}
import expensetracker.category.Category
import expensetracker.transaction.Transaction

import java.time.Instant

trait SyncService[F[_]]:
  def pullChanges(uid: UserId, from: Option[Instant]): F[DataChanges]
  def pushChanges(users: List[User], cats: List[Category], txs: List[Transaction]): F[Unit]

final private class LiveSyncService[F[_]](
    private val repository: SyncRepository[F]
) extends SyncService[F] {

  override def pullChanges(uid: UserId, from: Option[Instant]): F[DataChanges] =
    repository.pullChanges(uid, from)
    
  override def pushChanges(users: List[User], cats: List[Category], txs: List[Transaction]): F[Unit] = ???
}

object SyncService:
  def make[F[_]: Monad](repo: SyncRepository[F]): F[SyncService[F]] =
    Monad[F].pure(LiveSyncService[F](repo))
