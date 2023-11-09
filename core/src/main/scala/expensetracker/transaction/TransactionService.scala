package expensetracker.transaction

import cats.Monad
import expensetracker.transaction.db.TransactionRepository
import expensetracker.auth.user.UserId

import java.time.Instant

trait TransactionService[F[_]] {
  def getAll(aid: UserId, from: Option[Instant], to: Option[Instant]): F[List[Transaction]]
  def get(aid: UserId, txid: TransactionId): F[Transaction]
  def delete(aid: UserId, txid: TransactionId): F[Unit]
  def create(tx: CreateTransaction): F[TransactionId]
  def update(tx: Transaction): F[Unit]
  def hide(aid: UserId, txid: TransactionId, hidden: Boolean): F[Unit]
}

final private class LiveTransactionService[F[_]](
    private val repository: TransactionRepository[F]
) extends TransactionService[F] {
  override def create(tx: CreateTransaction): F[TransactionId] =
    repository.create(tx)

  // TODO: pass dates
  override def getAll(aid: UserId, from: Option[Instant], to: Option[Instant]): F[List[Transaction]] =
    repository.getAll(aid)

  override def get(aid: UserId, txid: TransactionId): F[Transaction] =
    repository.get(aid, txid)

  override def delete(aid: UserId, txid: TransactionId): F[Unit] =
    repository.delete(aid, txid)

  override def update(tx: Transaction): F[Unit] =
    repository.update(tx)

  override def hide(aid: UserId, txid: TransactionId, hidden: Boolean): F[Unit] =
    repository.hide(aid, txid, hidden)
}

object TransactionService:
  def make[F[_]: Monad](repository: TransactionRepository[F]): F[TransactionService[F]] =
    Monad[F].pure(LiveTransactionService[F](repository))
