package expensetracker.common.actions

import cats.Monad
import cats.effect.Temporal
import cats.syntax.apply.*
import cats.syntax.applicativeError.*
import expensetracker.auth.user.UserService
import expensetracker.category.CategoryService
import expensetracker.common.errors.AppError
import expensetracker.transaction.TransactionService
import fs2.Stream
import org.typelevel.log4cats.Logger

import scala.concurrent.duration.*

trait ActionProcessor[F[_]]:
  def run: Stream[F, Unit]

final private class LiveActionProcessor[F[_]](
    private val dispatcher: ActionDispatcher[F],
    private val userService: UserService[F],
    private val categoryService: CategoryService[F],
    private val transactionService: TransactionService[F]
)(using
    F: Temporal[F],
    logger: Logger[F]
) extends ActionProcessor[F] {

  override def run: Stream[F, Unit] =
    dispatcher.stream
      .parEvalMapUnordered(Int.MaxValue)(handleAction)

  private def handleAction(action: Action): F[Unit] =
    (action match {
      case Action.SetupNewUser(uid)                       => categoryService.assignDefault(uid)
      case Action.HideTransactionsByCategory(cid, hidden) => transactionService.hide(cid, hidden)
      case Action.SaveUsers(users)                        => userService.save(users)
      case Action.SaveCategories(categories)              => categoryService.save(categories)
      case Action.SaveTransactions(transactions)          => transactionService.save(transactions)
      case Action.GenerateInstances(tx)                   => ???
    }).handleErrorWith {
      case error: AppError =>
        logger.warn(error)(s"domain error while processing action $action")
      case error =>
        logger.error(error)(s"unexpected error processing action $action") *>
          F.sleep(1.second) *>
          dispatcher.dispatch(action)
    }
}

object ActionProcessor:
  def make[F[_]: Temporal: Logger](
      dispatcher: ActionDispatcher[F],
      userSvc: UserService[F],
      catSvc: CategoryService[F],
      txSvc: TransactionService[F]
  ): F[ActionProcessor[F]] =
    Monad[F].pure(LiveActionProcessor[F](dispatcher, userSvc, catSvc, txSvc))
