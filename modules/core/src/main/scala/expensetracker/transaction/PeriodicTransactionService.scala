package expensetracker.transaction

import cats.Monad
import cats.effect.Temporal
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.common.actions.{Action, ActionDispatcher}
import expensetracker.transaction.db.PeriodicTransactionRepository

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
    F: Temporal[F]
) extends PeriodicTransactionService[F] {

  def getAll(uid: UserId): F[List[PeriodicTransaction]]                = repository.getAll(uid)
  def hide(uid: UserId, txid: TransactionId, hidden: Boolean): F[Unit] = repository.hide(uid, txid, hidden)
  def hide(cid: CategoryId, hidden: Boolean): F[Unit]                  = repository.hide(cid, hidden)
  def save(txs: List[PeriodicTransaction]): F[Unit]                    = repository.save(txs)

  override def create(tx: CreatePeriodicTransaction): F[PeriodicTransaction] =
    for
      newTx <- repository.create(tx)
      _     <- dispatcher.dispatch(Action.GenerateInstances(newTx))
    yield newTx

  override def update(tx: PeriodicTransaction): F[Unit] = ???
  override def generateTxInstances: F[Unit]             = ???
}

object PeriodicTransactionService:
  def make[F[_]: Temporal](
      repository: PeriodicTransactionRepository[F],
      dispatcher: ActionDispatcher[F]
  ): F[PeriodicTransactionService[F]] =
    Monad[F].pure(LivePeriodicTransactionService[F](repository, dispatcher))
