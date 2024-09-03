package expensetracker.transaction

import cats.Monad
import expensetracker.transaction.db.TransactionRepository
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId

import java.time.Instant

trait TransactionService[F[_]] {
  def getAll(aid: UserId, from: Option[Instant], to: Option[Instant]): F[List[Transaction]]
  def get(aid: UserId, txid: TransactionId): F[Transaction]
  def delete(aid: UserId, txid: TransactionId): F[Unit]
  def create(tx: CreateTransaction): F[TransactionId]
  def update(tx: Transaction): F[Unit]
  def hide(aid: UserId, txid: TransactionId, hidden: Boolean): F[Unit]
  def hide(cid: CategoryId, hidden: Boolean): F[Unit]
}

final private class LiveTransactionService[F[_]](
    private val repository: TransactionRepository[F]
) extends TransactionService[F] {
  override def create(tx: CreateTransaction): F[TransactionId] =
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

  override def hide(cid: CategoryId, hidden: Boolean): F[Unit] =
    repository.hide(cid, hidden)
}

object TransactionService:
  def make[F[_]: Monad](repository: TransactionRepository[F]): F[TransactionService[F]] =
    Monad[F].pure(LiveTransactionService[F](repository))
