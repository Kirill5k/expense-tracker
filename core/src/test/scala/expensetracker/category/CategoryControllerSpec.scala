package expensetracker.category

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.account.AccountId
import org.http4s.{Method, Request, Status}
import org.http4s.implicits._

class CategoryControllerSpec extends ControllerSpec {

  "A CategoryController" when {
    "GET /categories" should {
      "return user's categories" in {
        val svc = mock[CategoryService[IO]]
        when(svc.getAll(any[AccountId])).thenReturn(IO.pure(List(cat)))

        val req = Request[IO](uri = uri"/categories", method = Method.GET).addCookie(sessionIdCookie)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Ok, Some(s"""[{"id":"${cid.value}","name":"cat-1","icon":"icon"}]"""))
        verify(svc).getAll(aid)
      }
    }

    "DELETE /categories/:id" should {
      "delete category by id" in {
        val svc = mock[CategoryService[IO]]
        when(svc.delete(any[AccountId], any[CategoryId])).thenReturn(IO.unit)

        val req = Request[IO](uri = uri"/categories/AB0C5342AB0C5342AB0C5342", method = Method.DELETE).addCookie(sessionIdCookie)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).delete(aid, CategoryId("AB0C5342AB0C5342AB0C5342"))
      }
    }
  }
}
