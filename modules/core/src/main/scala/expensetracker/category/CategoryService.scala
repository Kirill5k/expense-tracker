package expensetracker.category

import cats.Monad
import cats.syntax.flatMap.*
import expensetracker.auth.user.UserId
import expensetracker.category.db.CategoryRepository
import expensetracker.common.actions.{Action, ActionDispatcher}

trait CategoryService[F[_]] {
  def update(cat: Category): F[Unit]
  def create(cat: CreateCategory): F[Category]
  def get(uid: UserId, cid: CategoryId): F[Category]
  def getAll(uid: UserId): F[List[Category]]
  def delete(uid: UserId, cid: CategoryId): F[Unit]
  def assignDefault(uid: UserId): F[Unit]
  def hide(uid: UserId, cid: CategoryId, hidden: Boolean): F[Unit]
  def save(cats: List[Category]): F[Unit]
}

final private class LiveCategoryService[F[_]](
    private val repository: CategoryRepository[F],
    private val dispatcher: ActionDispatcher[F]
)(using
    F: Monad[F]
) extends CategoryService[F] {

  override def getAll(uid: UserId): F[List[Category]] =
    repository.getAll(uid)

  override def delete(uid: UserId, cid: CategoryId): F[Unit] =
    repository.delete(uid, cid)

  override def update(cat: Category): F[Unit] =
    repository.update(cat)

  override def create(cat: CreateCategory): F[Category] =
    repository.create(cat)

  override def get(uid: UserId, cid: CategoryId): F[Category] =
    repository.get(uid, cid)

  override def assignDefault(uid: UserId): F[Unit] =
    repository.assignDefault(uid)

  override def hide(uid: UserId, cid: CategoryId, hidden: Boolean): F[Unit] =
    repository.hide(uid: UserId, cid: CategoryId, hidden: Boolean) >>
      dispatcher.dispatch(Action.HideTransactionsByCategory(cid, hidden))

  override def save(cats: List[Category]): F[Unit] =
    F.whenA(cats.nonEmpty)(repository.save(cats))
}

object CategoryService:
  def make[F[_]: Monad](repo: CategoryRepository[F], disp: ActionDispatcher[F]): F[CategoryService[F]] =
    Monad[F].pure(LiveCategoryService[F](repo, disp))
