package expensetracker.category

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.account.AccountId
import expensetracker.common.errors.AppError.{CategoryAlreadyExists, CategoryDoesNotExist}
import org.http4s.{Method, Request, Status}
import org.http4s.implicits._
import org.http4s.circe.CirceEntityCodec._

class CategoryControllerSpec extends ControllerSpec {

  "A CategoryController" when {
    "POST /categories" should {
      "create new cat and return 201 on success" in {
        val svc = mock[CategoryService[IO]]
        when(svc.create(any[CreateCategory])).thenReturn(IO.pure(cid))

        val reqBody = parseJson("""{"name":"cat-1","icon":"icon","kind":"expense","color":"#2962FF"}""")
        val req =
          Request[IO](uri = uri"/categories", method = Method.POST).addCookie(sessIdCookie).withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Created, Some(s"""{"id":"${cid.value}"}"""))
        verify(svc).create {
          CreateCategory(
            CategoryKind.Expense,
            CategoryName("cat-1"),
            CategoryIcon("icon"),
            CategoryColor("#2962FF"),
            aid
          )
        }
      }

      "return 409 when cat name is taken" in {
        val svc = mock[CategoryService[IO]]
        when(svc.create(any[CreateCategory])).thenReturn(IO.raiseError(CategoryAlreadyExists(cname)))

        val reqBody = parseJson("""{"name":"cat-1","icon":"icon","kind":"expense","color":"#2962FF"}""")
        val req =
          Request[IO](uri = uri"/categories", method = Method.POST).addCookie(sessIdCookie).withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Conflict, Some(s"""{"message":"A category with name cat-1 already exists"}"""))
        verify(svc).create {
          CreateCategory(
            CategoryKind.Expense,
            CategoryName("cat-1"),
            CategoryIcon("icon"),
            CategoryColor("#2962FF"),
            aid
          )
        }
      }

      "return 422 when invalid kind passed" in {
        val svc = mock[CategoryService[IO]]

        val reqBody = parseJson("""{"name":"cat-1","icon":"icon","kind":"foo","color":"#2962FF"}""")
        val req =
          Request[IO](uri = uri"/categories", method = Method.POST).addCookie(sessIdCookie).withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.UnprocessableEntity,
          Some(s"""{"message":"invalid category kind foo: Field(kind)"}""")
        )
        verifyZeroInteractions(svc)
      }

      "return 422 when invalid color passed" in {
        val svc = mock[CategoryService[IO]]

        val reqBody = parseJson("""{"name":"cat-1","icon":"icon","kind":"income","color":"blue"}""")
        val req =
          Request[IO](uri = uri"/categories", method = Method.POST).addCookie(sessIdCookie).withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.UnprocessableEntity,
          Some("""{"message":"Validation failed: \"blue\".matches(\"^#[A-Za-z0-9]{3,6}$\").: Field(color)"}""")
        )
        verifyZeroInteractions(svc)
      }
    }

    "GET /categories" should {
      "return user's categories" in {
        val svc = mock[CategoryService[IO]]
        when(svc.getAll(any[AccountId])).thenReturn(IO.pure(List(cat)))

        val req = Request[IO](uri = uri"/categories", method = Method.GET).addCookie(sessIdCookie)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.Ok,
          Some(s"""[{"id":"${cid.value}","name":"cat-1","icon":"icon","kind":"expense","color":"#2962FF"}]""")
        )
        verify(svc).getAll(aid)
      }
    }

    "GET /categories/:id" should {
      "return user's category by id" in {
        val svc = mock[CategoryService[IO]]
        when(svc.get(any[AccountId], any[CategoryId])).thenReturn(IO.pure(cat))

        val req =
          Request[IO](uri = uri"/categories/AB0C5342AB0C5342AB0C5342", method = Method.GET).addCookie(sessIdCookie)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.Ok,
          Some(s"""{"id":"${cid.value}","name":"cat-1","icon":"icon","kind":"expense","color":"#2962FF"}""")
        )
        verify(svc).get(aid, cid)
      }
    }

    "PUT /categories/:id/hidden" should {
      "update user's category hidden status" in {
        val svc = mock[CategoryService[IO]]
        when(svc.hide(any[AccountId], any[CategoryId], anyBoolean)).thenReturn(IO.unit)

        val reqBody = parseJson("""{"hidden":true}""")
        val req = Request[IO](uri = uri"/categories/AB0C5342AB0C5342AB0C5342/hidden", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).hide(aid, cid, true)
      }
    }

    "PUT /categories/:id" should {
      "update user's category" in {
        val svc = mock[CategoryService[IO]]
        when(svc.update(any[Category])).thenReturn(IO.unit)

        val reqBody = parseJson(
          """{"id":"AB0C5342AB0C5342AB0C5342","name":"c2","icon":"icon","kind":"expense","color":"#2962FF"}"""
        )
        val req = Request[IO](uri = uri"/categories/AB0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).update(
          Category(
            cid,
            CategoryKind.Expense,
            CategoryName("c2"),
            CategoryIcon("icon"),
            CategoryColor("#2962FF"),
            Some(aid)
          )
        )
      }

      "return 400 when provided ids do not match" in {
        val svc = mock[CategoryService[IO]]

        val reqBody = parseJson(
          """{"id":"AB0C5342AB0C5342AB0C5341","name":"c2","icon":"icon","kind":"expense","color":"#2962FF"}"""
        )
        val req = Request[IO](uri = uri"/categories/AB0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """{"message":"The id supplied in the path does not match with the id in the request body"}"""
        verifyJsonResponse(res, Status.BadRequest, Some(resBody))
        verifyZeroInteractions(svc)
      }

      "return 422 when request has validation errors" in {
        val svc = mock[CategoryService[IO]]

        val reqBody = parseJson("""{"id":"AB0C5342AB0C5342AB0C5341","name":"","icon":"icon","kind":"expense"}""")
        val req = Request[IO](uri = uri"/categories/AB0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """{"message":"Validation isEmpty() did not fail.: Field(name)"}"""
        verifyJsonResponse(res, Status.UnprocessableEntity, Some(resBody))
        verifyZeroInteractions(svc)
      }

      "return 404 when category does not exist" in {
        val svc = mock[CategoryService[IO]]
        when(svc.update(any[Category])).thenReturn(IO.raiseError(CategoryDoesNotExist(cid)))

        val reqBody = parseJson(
          """{"id":"AB0C5342AB0C5342AB0C5342","name":"c2","icon":"icon","kind":"expense","color":"#2962FF"}"""
        )
        val req = Request[IO](uri = uri"/categories/AB0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """{"message":"Category with id AB0C5342AB0C5342AB0C5342 does not exist"}"""
        verifyJsonResponse(res, Status.NotFound, Some(resBody))
        verify(svc).update(
          Category(
            cid,
            CategoryKind.Expense,
            CategoryName("c2"),
            CategoryIcon("icon"),
            CategoryColor("#2962FF"),
            Some(aid)
          )
        )
      }
    }

    "DELETE /categories/:id" should {
      "delete category by id" in {
        val svc = mock[CategoryService[IO]]
        when(svc.delete(any[AccountId], any[CategoryId])).thenReturn(IO.unit)

        val req = Request[IO](uri = uri"/categories/AB0C5342AB0C5342AB0C5342", method = Method.DELETE)
          .addCookie(sessIdCookie)
        val res = CategoryController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).delete(aid, CategoryId("AB0C5342AB0C5342AB0C5342"))
      }
    }
  }
}
