package expensetracker.transaction

import cats.Monad
import expensetracker.transaction.db.TransactionRepository
import expensetracker.account.AccountId
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId

import java.time.Instant

trait TransactionService[F[_]]:
  def getAll(aid: UserId, from: Option[Instant], to: Option[Instant]): F[List[Transaction]]
  def get(aid: UserId, txid: TransactionId): F[Transaction]
  def delete(aid: UserId, txid: TransactionId): F[Unit]
  def create(tx: CreateTransaction): F[Transaction]
  def update(tx: Transaction): F[Unit]
  def hide(aid: UserId, txid: TransactionId, hidden: Boolean): F[Unit]
  def hideByCategory(cid: CategoryId, hidden: Boolean): F[Unit]
  def hideByAccount(cid: AccountId, hidden: Boolean): F[Unit]
  def save(txs: List[Transaction]): F[Unit]
  def deleteAll(uid: UserId): F[Unit]

final private class LiveTransactionService[F[_]](
    private val repository: TransactionRepository[F]
)(using
    F: Monad[F]
) extends TransactionService[F] {
  override def create(tx: CreateTransaction): F[Transaction] =
    repository.create(tx)

  override def getAll(aid: UserId, from: Option[Instant], to: Option[Instant]): F[List[Transaction]] =
    repository.getAll(aid, from, to)

  override def get(aid: UserId, txid: TransactionId): F[Transaction] =
    repository.get(aid, txid)

  override def delete(aid: UserId, txid: TransactionId): F[Unit] =
    repository.delete(aid, txid)

  override def update(tx: Transaction): F[Unit] =
    repository.update(tx)

  override def hide(aid: UserId, txid: TransactionId, hidden: Boolean): F[Unit] =
    repository.hide(aid, txid, hidden)

  override def hideByCategory(cid: CategoryId, hidden: Boolean): F[Unit] =
    repository.hideByCategory(cid, hidden)

  override def hideByAccount(cid: AccountId, hidden: Boolean): F[Unit] =
    repository.hideByAccount(cid, hidden)

  override def save(txs: List[Transaction]): F[Unit] =
    F.whenA(txs.nonEmpty)(repository.save(txs))

  override def deleteAll(uid: UserId): F[Unit] =
    repository.deleteAll(uid)
}

object TransactionService:
  def make[F[_]: Monad](repository: TransactionRepository[F]): F[TransactionService[F]] =
    Monad[F].pure(LiveTransactionService[F](repository))
