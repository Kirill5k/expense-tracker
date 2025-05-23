package expensetracker.category

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.Resources
import expensetracker.category.db.CategoryRepository
import expensetracker.common.actions.ActionDispatcher
import expensetracker.common.web.Controller

final class Categories[F[_]] private (
    val service: CategoryService[F],
    val controller: Controller[F]
)

object Categories {
  def make[F[_]: Async](resources: Resources[F], disp: ActionDispatcher[F]): F[Categories[F]] =
    for
      repo <- CategoryRepository.make[F](resources.mongoDb)
      svc  <- CategoryService.make[F](repo, disp)
      ctrl <- CategoryController.make[F](svc)
    yield Categories[F](svc, ctrl)
}
