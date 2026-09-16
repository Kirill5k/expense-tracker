package expensetracker.transaction

import cats.Monad
import cats.effect.Temporal
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.account.AccountId
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.transaction.db.PeriodicTransactionRepository
import kirill5k.common.cats.Clock
import kirill5k.common.syntax.time.*

import java.time.LocalDate

trait PeriodicTransactionService[F[_]]:
  def getAll(uid: UserId): F[List[PeriodicTransaction]]
  def create(tx: CreatePeriodicTransaction): F[PeriodicTransaction]
  def update(tx: PeriodicTransaction): F[Unit]
  def hide(uid: UserId, txid: TransactionId, hidden: Boolean): F[Unit]
  def hideByCategory(cid: CategoryId, hidden: Boolean): F[Unit]
  def hideByAccount(cid: AccountId, hidden: Boolean): F[Unit]
  def save(txs: List[PeriodicTransaction]): F[Unit]
  def advanceRecurrences(checkpoints: List[RecurrenceCheckpoint]): F[Unit]
  def validCheckpointIds(checkpoints: List[RecurrenceCheckpoint]): F[Set[TransactionId]]
  def generateRecurrencesForToday: F[Unit]
  def deleteAll(uid: UserId): F[Unit]

final private class LivePeriodicTransactionService[F[_]](
    private val repository: PeriodicTransactionRepository[F],
    private val dispatcher: ActionDispatcher[F]
)(using
    F: Temporal[F],
    C: Clock[F]
) extends PeriodicTransactionService[F] {

  def getAll(uid: UserId): F[List[PeriodicTransaction]]                    = repository.getAll(uid)
  def hide(uid: UserId, txid: TransactionId, hidden: Boolean): F[Unit]     = repository.hide(uid, txid, hidden)
  def hideByCategory(cid: CategoryId, hidden: Boolean): F[Unit]            = repository.hideByCategory(cid, hidden)
  def hideByAccount(cid: AccountId, hidden: Boolean): F[Unit]              = repository.hideByAccount(cid, hidden)
  def save(txs: List[PeriodicTransaction]): F[Unit]                        = F.whenA(txs.nonEmpty)(repository.save(txs))
  def advanceRecurrences(checkpoints: List[RecurrenceCheckpoint]): F[Unit] =
    F.whenA(checkpoints.nonEmpty)(repository.advanceRecurrences(checkpoints))
  def validCheckpointIds(checkpoints: List[RecurrenceCheckpoint]): F[Set[TransactionId]] =
    repository.validCheckpointIds(checkpoints)

  override def create(tx: CreatePeriodicTransaction): F[PeriodicTransaction] =
    for
      newTx <- repository.create(tx)
      now   <- C.now.map(_.toLocalDate)
      (updatedTx, txInstances) = generateTxInstances(newTx, now)
      _ <-
        if txInstances.isEmpty then save(List(updatedTx))
        else dispatcher.dispatch(Action.SaveGeneratedRecurrences(txInstances, List(checkpoint(newTx, updatedTx))))
    yield updatedTx

  override def update(tx: PeriodicTransaction): F[Unit] =
    for
      now <- C.now.map(_.toLocalDate)
      dates = tx.recurrence.copy(nextDate = None).dateSequence(now)
      _ <- repository.update(tx.withUpdatedNextDate(dates.headOption.getOrElse(now)))
    yield ()

  private def generateTxInstances(tx: PeriodicTransaction, dateUntil: LocalDate): (PeriodicTransaction, List[Transaction]) = {
    val dates      = tx.recurrence.dateSequence(dateUntil)
    val newTxs     = dates.reverse.map(tx.toTransaction)
    val updatedPTx = tx.withUpdatedNextDate(dates.headOption.getOrElse(dateUntil))
    updatedPTx -> newTxs
  }

  private def checkpoint(previous: PeriodicTransaction, updated: PeriodicTransaction): RecurrenceCheckpoint =
    RecurrenceCheckpoint(previous.id, previous.userId, previous.recurrence, updated.recurrence.nextDate)

  override def generateRecurrencesForToday: F[Unit] =
    for
      now <- C.now.map(_.toLocalDate)
      txs <- repository.getAllByRecurrenceDate(now)
      (checkpoints, updTxs) = txs.foldLeft((List.empty[RecurrenceCheckpoint], List.empty[Transaction])) { case ((checkpoints, txs), ptx) =>
        val (updPtx, newTxs) = generateTxInstances(ptx, now)
        (checkpoint(ptx, updPtx) :: checkpoints, newTxs ::: txs)
      }
      _ <- F.whenA(checkpoints.nonEmpty)(dispatcher.dispatch(Action.SaveGeneratedRecurrences(updTxs, checkpoints)))
    yield ()

  override def deleteAll(uid: UserId): F[Unit] =
    repository.deleteAll(uid)
}

object PeriodicTransactionService:
  def make[F[_]: {Temporal, Clock}](
      repository: PeriodicTransactionRepository[F],
      dispatcher: ActionDispatcher[F]
  ): F[PeriodicTransactionService[F]] =
    Monad[F].pure(LivePeriodicTransactionService[F](repository, dispatcher))
