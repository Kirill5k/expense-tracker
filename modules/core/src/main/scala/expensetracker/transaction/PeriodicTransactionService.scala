package expensetracker.transaction

import cats.Monad
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.common.actions.ActionDispatcher
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
) extends PeriodicTransactionService[F] {

  override def create(tx: CreatePeriodicTransaction): F[PeriodicTransaction]    = ???
  override def update(tx: PeriodicTransaction): F[Unit]                         = ???
  override def hide(uid: UserId, txid: TransactionId, hidden: Boolean): F[Unit] = ???
  override def hide(cid: CategoryId, hidden: Boolean): F[Unit]                  = ???
  override def save(txs: List[PeriodicTransaction]): F[Unit]                    = ???
  override def generateTxInstances: F[Unit]                                     = ???
  override def getAll(uid: UserId): F[List[PeriodicTransaction]]                = ???
}

object PeriodicTransactionService:
  def make[F[_]: Monad](
      repository: PeriodicTransactionRepository[F],
      dispatcher: ActionDispatcher[F]
  ): F[PeriodicTransactionService[F]] =
    Monad[F].pure(LivePeriodicTransactionService[F](repository, dispatcher))
