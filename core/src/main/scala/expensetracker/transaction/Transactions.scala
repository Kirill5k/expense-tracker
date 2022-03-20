package expensetracker.transaction

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.Resources
import expensetracker.auth.session.Session
import expensetracker.transaction.db.TransactionRepository
import org.http4s.HttpRoutes
import org.http4s.server.AuthMiddleware
import org.typelevel.log4cats.Logger

final class Transactions[F[_]] private (
    val controller: TransactionController[F]
)

object Transactions {
  def make[F[_]: Async: Logger](resources: Resources[F]): F[Transactions[F]] =
    for {
      repo <- TransactionRepository.make[F](resources.mongo)
      svc  <- TransactionService.make[F](repo)
      ctrl <- TransactionController.make[F](svc)
    } yield new Transactions[F](ctrl)
}
