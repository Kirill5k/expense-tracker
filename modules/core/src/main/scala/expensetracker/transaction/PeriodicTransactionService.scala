package expensetracker.transaction

import cats.Monad
import cats.effect.Temporal
import cats.syntax.flatMap.*
import cats.syntax.functor.*
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
  def hide(cid: CategoryId, hidden: Boolean): F[Unit]
  def save(txs: List[PeriodicTransaction]): F[Unit]
  def generateTxInstances: F[Unit]

final private class LivePeriodicTransactionService[F[_]](
    private val repository: PeriodicTransactionRepository[F],
    private val dispatcher: ActionDispatcher[F]
)(using
    F: Temporal[F],
    C: Clock[F]
) extends PeriodicTransactionService[F] {

  def getAll(uid: UserId): F[List[PeriodicTransaction]]                = repository.getAll(uid)
  def hide(uid: UserId, txid: TransactionId, hidden: Boolean): F[Unit] = repository.hide(uid, txid, hidden)
  def hide(cid: CategoryId, hidden: Boolean): F[Unit]                  = repository.hide(cid, hidden)
  def save(txs: List[PeriodicTransaction]): F[Unit]                    = F.whenA(txs.nonEmpty)(repository.save(txs))

  override def create(tx: CreatePeriodicTransaction): F[PeriodicTransaction] =
    for
      newTx <- repository.create(tx)
      now   <- C.now.map(_.toLocalDate)
      (updatedTx, txInstances) = generateTxInstances(newTx, now)
      _ <- repository.save(List(updatedTx))
      _ <- dispatcher.dispatch(Action.SaveTransactions(txInstances))
    yield updatedTx

  override def update(tx: PeriodicTransaction): F[Unit] =
    for
      now <- C.now.map(_.toLocalDate)
      _   <- repository.update(tx.withUpdatedNextDate(now))
    yield ()

  private def generateTxInstances(tx: PeriodicTransaction, date: LocalDate): (PeriodicTransaction, List[Transaction]) = {
    val dates      = tx.recurrence.dateSequence(date)
    val newTxs     = dates.map(tx.toTransaction)
    val updatedPTx = tx.withUpdatedNextDate(date)
    updatedPTx -> newTxs
  }

  override def generateTxInstances: F[Unit] = ???
}

object PeriodicTransactionService:
  def make[F[_]: Temporal: Clock](
      repository: PeriodicTransactionRepository[F],
      dispatcher: ActionDispatcher[F]
  ): F[PeriodicTransactionService[F]] =
    Monad[F].pure(LivePeriodicTransactionService[F](repository, dispatcher))
