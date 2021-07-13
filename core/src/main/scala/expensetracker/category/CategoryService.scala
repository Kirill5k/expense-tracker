package expensetracker.category

import cats.Monad
import expensetracker.auth.user.UserId
import expensetracker.category.db.CategoryRepository

trait CategoryService[F[_]] {
  def update(cat: Category): F[Unit]
  def create(cat: CreateCategory): F[CategoryId]
  def get(aid: UserId, cid: CategoryId): F[Category]
  def getAll(aid: UserId): F[List[Category]]
  def delete(aid: UserId, cid: CategoryId): F[Unit]
  def assignDefault(aid: UserId): F[Unit]
  def hide(aid: UserId, cid: CategoryId, hidden: Boolean): F[Unit]
}

final private class LiveCategoryService[F[_]](
    private val repository: CategoryRepository[F]
) extends CategoryService[F] {

  override def getAll(aid: UserId): F[List[Category]] =
    repository.getAll(aid)

  override def delete(aid: UserId, cid: CategoryId): F[Unit] =
    repository.delete(aid, cid)

  override def update(cat: Category): F[Unit] =
    repository.update(cat)

  override def create(cat: CreateCategory): F[CategoryId] =
    repository.create(cat)

  override def get(aid: UserId, cid: CategoryId): F[Category] =
    repository.get(aid, cid)

  override def assignDefault(aid: UserId): F[Unit] =
    repository.assignDefault(aid)

  override def hide(aid: UserId, cid: CategoryId, hidden: Boolean): F[Unit] =
    repository.hide(aid: UserId, cid: CategoryId, hidden: Boolean)
}

object CategoryService {
  def make[F[_]: Monad](repository: CategoryRepository[F]): F[CategoryService[F]] =
    Monad[F].pure(new LiveCategoryService[F](repository))
}
