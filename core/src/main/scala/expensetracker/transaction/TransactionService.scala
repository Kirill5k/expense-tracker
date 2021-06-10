package expensetracker.transaction

import cats.Monad
import expensetracker.transaction.db.TransactionRepository
import expensetracker.user.UserId

trait TransactionService[F[_]] {
  def getAll(userId: UserId): F[List[Transaction]]
  def create(tx: CreateTransaction): F[Unit]
}

final private class LiveTransactionService[F[_]](
    private val repository: TransactionRepository[F]
) extends TransactionService[F] {
  override def create(tx: CreateTransaction): F[Unit] =
    repository.create(tx)

  override def getAll(userId: UserId): F[List[Transaction]] =
    repository.getAll(userId)
}

object TransactionService {
  def make[F[_]: Monad](repository: TransactionRepository[F]): F[TransactionService[F]] =
    Monad[F].pure(new LiveTransactionService[F](repository))

}
