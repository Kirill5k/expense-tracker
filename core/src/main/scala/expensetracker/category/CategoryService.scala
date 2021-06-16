package expensetracker.category

import cats.Monad
import expensetracker.auth.account.AccountId
import expensetracker.category.db.CategoryRepository

trait CategoryService[F[_]] {
  def update(cat: Category): F[Unit]
  def create(cat: CreateCategory): F[CategoryId]
  def getAll(aid: AccountId): F[List[Category]]
  def delete(aid: AccountId, cid: CategoryId): F[Unit]
}

final private class LiveCategoryService[F[_]](
    private val repository: CategoryRepository[F]
) extends CategoryService[F] {

  override def getAll(aid: AccountId): F[List[Category]] =
    repository.getAll(aid)

  override def delete(aid: AccountId, cid: CategoryId): F[Unit] =
    repository.delete(aid, cid)

  override def update(cat: Category): F[Unit] =
    repository.update(cat)

  override def create(cat: CreateCategory): F[CategoryId] =
    repository.create(cat)
}

object CategoryService {
  def make[F[_]: Monad](repository: CategoryRepository[F]): F[CategoryService[F]] =
    Monad[F].pure(new LiveCategoryService[F](repository))
}
