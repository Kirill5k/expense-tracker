package expensetracker.sync

import expensetracker.auth.user.UserId

import java.time.Instant

trait SyncService[F[_]]:
  def pullChanges(uid: UserId, from: Option[Instant]): F[DataChanges]
