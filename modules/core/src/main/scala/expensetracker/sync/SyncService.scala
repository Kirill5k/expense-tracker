package expensetracker.sync

import cats.Monad
import expensetracker.auth.user.UserId

import java.time.Instant

trait SyncService[F[_]]:
  def pullChanges(uid: UserId, from: Option[Instant]): F[DataChanges]

final private class LiveSyncService[F[_]](
    private val repository: SyncRepository[F]
) extends SyncService[F] {

  override def pullChanges(uid: UserId, from: Option[Instant]): F[DataChanges] =
    repository.pullChanges(uid, from)
}

object SyncService:
  def make[F[_]: Monad](repo: SyncRepository[F]): F[SyncService[F]] =
    Monad[F].pure(LiveSyncService[F](repo))
