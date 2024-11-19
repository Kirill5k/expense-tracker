package expensetracker.transaction

import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId

trait PeriodicTransactionService[F[_]]:
  def getAll(uid: UserId): F[List[PeriodicTransaction]]
  def create(tx: CreatePeriodicTransaction): F[PeriodicTransaction]
  def update(tx: PeriodicTransaction): F[Unit]
  def hide(uid: UserId, txid: TransactionId, hidden: Boolean): F[Unit]
  def hide(cid: CategoryId, hidden: Boolean): F[Unit]
  def save(txs: List[PeriodicTransaction]): F[Unit]
  def generateTxInstances: F[Unit]