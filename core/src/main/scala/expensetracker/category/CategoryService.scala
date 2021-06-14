package expensetracker.category

import cats.Monad
import expensetracker.auth.account.AccountId
import expensetracker.category.db.CategoryRepository

trait CategoryService[F[_]] {
  def getAll(uid: AccountId): F[List[Category]]
  def delete(uid: AccountId, cid: CategoryId): F[Unit]
}

final private class LiveCategoryService[F[_]](
    private val repository: CategoryRepository[F]
) extends CategoryService[F] {

  override def getAll(uid: AccountId): F[List[Category]] =
    repository.getAll(uid)

  override def delete(uid: AccountId, cid: CategoryId): F[Unit] =
    repository.delete(uid, cid)
}

object CategoryService {
  def make[F[_]: Monad](repository: CategoryRepository[F]): F[CategoryService[F]] =
    Monad[F].pure(new LiveCategoryService[F](repository))
}
