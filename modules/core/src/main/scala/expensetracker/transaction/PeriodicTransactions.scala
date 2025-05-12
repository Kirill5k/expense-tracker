package expensetracker.transaction

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.Resources
import expensetracker.common.web.Controller
import expensetracker.common.actions.ActionDispatcher
import expensetracker.transaction.db.PeriodicTransactionRepository

final class PeriodicTransactions[F[_]] private (
    val service: PeriodicTransactionService[F],
    val controller: Controller[F]
)

object PeriodicTransactions:
  def make[F[_]: Async](resources: Resources[F], dispatcher: ActionDispatcher[F]): F[PeriodicTransactions[F]] =
    for
      repo <- PeriodicTransactionRepository.make[F](resources.mongoDb, resources.mongoSession)
      svc  <- PeriodicTransactionService.make[F](repo, dispatcher)
      ctrl <- PeriodicTransactionController.make(svc)
    yield PeriodicTransactions[F](svc, ctrl)
