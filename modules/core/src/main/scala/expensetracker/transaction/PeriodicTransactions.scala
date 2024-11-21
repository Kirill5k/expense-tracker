package expensetracker.transaction

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.Resources
import expensetracker.common.actions.ActionDispatcher
import expensetracker.transaction.db.PeriodicTransactionRepository
import org.typelevel.log4cats.Logger

final class PeriodicTransactions[F[_]] private (
    val service: PeriodicTransactionService[F]
)

object PeriodicTransactions:
  def make[F[_]: Async: Logger](resources: Resources[F], dispatcher: ActionDispatcher[F]): F[PeriodicTransactions[F]] =
    for
      repo <- PeriodicTransactionRepository.make[F](resources.mongoDb, resources.mongoSession)
      svc  <- PeriodicTransactionService.make[F](repo, dispatcher)
    yield PeriodicTransactions[F](svc)
