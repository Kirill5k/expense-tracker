package expensetracker.category

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.account.AccountId
import org.http4s.{Method, Request, Status}
import org.http4s.implicits._
import org.http4s.circe.CirceEntityCodec._

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

    "PUT /categories/:id" should {
      "update user's category" in {
        val svc = mock[CategoryService[IO]]
        when(svc.update(any[Category])).thenReturn(IO.unit)

        val reqBody = parseJson("""{"id":"AB0C5342AB0C5342AB0C5342","name":"c2","icon":"icon"}""")
        val req = Request[IO](uri = uri"/categories/AB0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessionIdCookie)
          .withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).update(Category(cid, CategoryName("c2"), CategoryIcon("icon"), Some(aid)))
      }

      "return 400 when provided ids do not match" in {
        val svc = mock[CategoryService[IO]]

        val reqBody = parseJson("""{"id":"AB0C5342AB0C5342AB0C5341","name":"c2","icon":"icon"}""")
        val req = Request[IO](uri = uri"/categories/AB0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessionIdCookie)
          .withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessionMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.BadRequest, Some("""{"message":"the id supplied in the path does not match with the id in the request body"}"""))
        verifyZeroInteractions(svc)
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
