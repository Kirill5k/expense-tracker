package expensetracker.sync

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.Resources
import expensetracker.common.actions.ActionDispatcher
import expensetracker.sync.db.SyncRepository
import expensetracker.common.web.Controller
import org.typelevel.log4cats.Logger

final class Sync[F[_]] private (
    val service: SyncService[F],
    val controller: Controller[F]
)

object Sync {
  def make[F[_]: {Async, Logger}](resources: Resources[F], disp: ActionDispatcher[F]): F[Sync[F]] =
    for
      repo <- SyncRepository.make[F](resources.mongoDb)
      svc  <- SyncService.make[F](repo, disp)
      ctrl <- SyncController.make[F](svc)
    yield Sync[F](svc, ctrl)
}
