package expensetracker.common.actions

import cats.Monad
import cats.effect.Temporal
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import cats.syntax.applicativeError.*
import expensetracker.auth.user.UserService
import expensetracker.category.CategoryService
import expensetracker.common.actions.Action.HideTransactionsByAccount
import expensetracker.common.errors.AppError
import expensetracker.transaction.{PeriodicTransactionService, TransactionService}
import kirill5k.common.syntax.time.*
import kirill5k.common.cats.Clock
import fs2.Stream
import org.typelevel.log4cats.Logger

import scala.concurrent.duration.*

trait ActionProcessor[F[_]]:
  def run: Stream[F, Unit]

final private class LiveActionProcessor[F[_]: Temporal](
    private val dispatcher: ActionDispatcher[F],
    private val userService: UserService[F],
    private val catService: CategoryService[F],
    private val txService: TransactionService[F],
    private val ptxService: PeriodicTransactionService[F]
)(using
    clock: Clock[F],
    logger: Logger[F]
) extends ActionProcessor[F] {

  override def run: Stream[F, Unit] =
    dispatcher.stream
      .parEvalMapUnordered(Int.MaxValue)(handleAction)

  private def handleAction(action: Action): F[Unit] =
    (action match
      case Action.DeleteAllCategories(uid)                        => catService.deleteAll(uid)
      case Action.DeleteAllTransactions(uid)                      => txService.deleteAll(uid)
      case Action.DeleteAllPeriodicTransactions(uid)              => ptxService.deleteAll(uid)
      //TODO: Create default account
      case Action.SetupNewUser(uid)                               => catService.assignDefault(uid)
      case Action.HideTransactionsByCategory(cid, hidden)         => txService.hide(cid, hidden) >> ptxService.hide(cid, hidden)
      case HideTransactionsByAccount(aid, hidden) => Temporal[F].unit //TODO: Implement
      case Action.SaveUsers(users)                                => userService.save(users)
      case Action.SaveCategories(categories)                      => catService.save(categories)
      case Action.SaveTransactions(transactions)                  => txService.save(transactions)
      case Action.SavePeriodicTransactions(periodicTransactions)  => ptxService.save(periodicTransactions)
      case Action.GeneratePeriodicTransactionRecurrences          => ptxService.generateRecurrencesForToday
      case Action.SchedulePeriodicTransactionRecurrenceGeneration => schedulePeriodicTransactionRecurrenceGeneration
    ).handleErrorWith {
      case error: AppError =>
        logger.warn(error)(s"domain error while processing action $action")
      case error =>
        logger.error(error)(s"unexpected error processing action $action") >>
          clock.sleep(1.second) >>
          dispatcher.dispatch(action)
    }

  private def schedulePeriodicTransactionRecurrenceGeneration: F[Unit] =
    for
      now <- clock.now
      nextDay  = now.toLocalDate.plusDays(1).toInstantAtStartOfDay
      duration = nextDay.durationBetween(now)
      _ <- logger.info(s"scheduling periodic transaction recurrences generation to happen in ${duration.toReadableString} ($now-$nextDay)")
      _ <- clock.sleep(duration)
      _ <- dispatcher.dispatch(Action.GeneratePeriodicTransactionRecurrences)
      _ <- dispatcher.dispatch(Action.SchedulePeriodicTransactionRecurrenceGeneration)
    yield ()
}

object ActionProcessor:
  def make[F[_]: {Temporal, Logger, Clock}](
      dispatcher: ActionDispatcher[F],
      userSvc: UserService[F],
      catSvc: CategoryService[F],
      txSvc: TransactionService[F],
      ptxSvc: PeriodicTransactionService[F]
  ): F[ActionProcessor[F]] =
    Monad[F].pure(LiveActionProcessor[F](dispatcher, userSvc, catSvc, txSvc, ptxSvc))
