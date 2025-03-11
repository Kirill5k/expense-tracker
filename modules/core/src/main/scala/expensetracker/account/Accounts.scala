package expensetracker.account

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.Resources
import expensetracker.account.db.AccountRepository
import expensetracker.common.actions.ActionDispatcher

final class Accounts[F[_]] private (
    val service: AccountService[F]
)

object Accounts:
  def make[F[_]: Async](resources: Resources[F], disp: ActionDispatcher[F]): F[Accounts[F]] =
    for
      repo <- AccountRepository.make[F](resources.mongoDb)
      svc  <- AccountService.make[F](repo, disp)
    yield Accounts[F](svc)
