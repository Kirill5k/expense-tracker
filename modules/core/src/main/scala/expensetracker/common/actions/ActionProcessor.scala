package expensetracker.common.actions

import cats.effect.Temporal
import cats.effect.std.Semaphore
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.account.AccountService
import expensetracker.auth.user.UserService
import expensetracker.category.CategoryService
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
    private val ptxService: PeriodicTransactionService[F],
    private val accService: AccountService[F],
    private val userDataDeletion: Semaphore[F]
)(using
    clock: Clock[F],
    logger: Logger[F]
) extends ActionProcessor[F] {

  override def run: Stream[F, Unit] =
    dispatcher.process(handleAction, handleBackgroundFailure)

  private def handleAction(action: Action): F[Unit] =
    action match
      case Action.DeleteAllUserData(uid) =>
        userDataDeletion.permit.use { _ =>
          ptxService.deleteAll(uid) >> txService.deleteAll(uid) >> catService.deleteAll(uid) >> accService.deleteAll(uid)
        }
      case Action.DeleteAllAccounts(uid)             => accService.deleteAll(uid)
      case Action.DeleteAllCategories(uid)           => catService.deleteAll(uid)
      case Action.DeleteAllTransactions(uid)         => txService.deleteAll(uid)
      case Action.DeleteAllPeriodicTransactions(uid) => ptxService.deleteAll(uid)
      case Action.SetupNewUser(uid, currency)        =>
        userDataDeletion.permit.use(_ => catService.assignDefault(uid) >> accService.createDefault(uid, currency))
      case Action.HideTransactionsByCategory(cid, hidden) => txService.hideByCategory(cid, hidden) >> ptxService.hideByCategory(cid, hidden)
      case Action.HideTransactionsByAccount(aid, hidden)  => txService.hideByAccount(aid, hidden) >> ptxService.hideByAccount(aid, hidden)
      case Action.SaveUsers(users)                        => userService.save(users)
      case Action.SaveAccounts(accounts)                  => accService.save(accounts)
      case Action.SaveCategories(categories)              => catService.save(categories)
      case Action.SaveTransactions(transactions)          => txService.save(transactions)
      // Keep the checkpoint behind durable ledger writes. Retrying uses deterministic transaction IDs.
      case Action.SaveGeneratedRecurrences(transactions, checkpoints) =>
        userDataDeletion.permit.use { _ =>
          ptxService.validCheckpointIds(checkpoints).flatMap { validIds =>
            Temporal[F].whenA(validIds.nonEmpty) {
              txService.saveGenerated(transactions.filter(_.parentTransactionId.exists(validIds.contains))) >>
                ptxService.advanceRecurrences(checkpoints.filter(checkpoint => validIds.contains(checkpoint.id)))
            }
          }
        }
      case Action.SavePeriodicTransactions(periodicTransactions)  => ptxService.save(periodicTransactions)
      case Action.GeneratePeriodicTransactionRecurrences          => ptxService.generateRecurrencesForToday
      case Action.SchedulePeriodicTransactionRecurrenceGeneration => schedulePeriodicTransactionRecurrenceGeneration
  private def handleBackgroundFailure(action: Action, error: Throwable): F[Unit] =
    error match
      case error: AppError =>
        logger.warn(error)(s"domain error while processing action $action")
      case error =>
        logger.error(error)(s"unexpected error processing action $action") >>
          clock.sleep(1.second) >>
          dispatcher.dispatch(action)

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
      ptxSvc: PeriodicTransactionService[F],
      accSvc: AccountService[F]
  ): F[ActionProcessor[F]] =
    Semaphore[F](1).map(semaphore => LiveActionProcessor[F](dispatcher, userSvc, catSvc, txSvc, ptxSvc, accSvc, semaphore))
