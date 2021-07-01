package expensetracker.transaction

import cats.Monad
import expensetracker.transaction.db.TransactionRepository
import expensetracker.auth.account.AccountId

trait TransactionService[F[_]] {
  def getAll(aid: AccountId): F[List[Transaction]]
  def get(aid: AccountId, txid: TransactionId): F[Transaction]
  def delete(aid: AccountId, txid: TransactionId): F[Unit]
  def create(tx: CreateTransaction): F[TransactionId]
  def update(tx: Transaction): F[Unit]
}

final private class LiveTransactionService[F[_]](
    private val repository: TransactionRepository[F]
) extends TransactionService[F] {
  override def create(tx: CreateTransaction): F[TransactionId] =
    repository.create(tx)

  override def getAll(aid: AccountId): F[List[Transaction]] =
    repository.getAll(aid)

  override def get(aid: AccountId, txid: TransactionId): F[Transaction] =
    repository.get(aid, txid)

  override def delete(aid: AccountId, txid: TransactionId): F[Unit] =
    repository.delete(aid, txid)

  override def update(tx: Transaction): F[Unit] =
    repository.update(tx)
}

object TransactionService {
  def make[F[_]: Monad](repository: TransactionRepository[F]): F[TransactionService[F]] =
    Monad[F].pure(new LiveTransactionService[F](repository))

}
