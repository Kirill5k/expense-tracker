package expensetracker.category

import cats.effect.Async
import cats.implicits.*
import expensetracker.Resources
import expensetracker.auth.session.Session
import expensetracker.category.db.CategoryRepository
import org.http4s.HttpRoutes
import org.http4s.server.AuthMiddleware
import org.typelevel.log4cats.Logger

final class Categories[F[_]] private (
    val service: CategoryService[F],
    val controller: CategoryController[F]
) {
  def routes(authMiddleware: AuthMiddleware[F, Session]): HttpRoutes[F] = controller.routes(authMiddleware)
}

object Categories {
  def make[F[_]: Async: Logger](resources: Resources[F]): F[Categories[F]] =
    for {
      repo <- CategoryRepository.make[F](resources.mongo)
      svc  <- CategoryService.make[F](repo)
      ctrl <- CategoryController.make[F](svc)
    } yield new Categories[F](svc, ctrl)
}
