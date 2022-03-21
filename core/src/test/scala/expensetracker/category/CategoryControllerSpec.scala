package expensetracker.category

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.Authenticator
import expensetracker.auth.user.UserId
import expensetracker.common.errors.AppError.{CategoryAlreadyExists, CategoryDoesNotExist, ExpiredSession}
import expensetracker.fixtures.{Categories, Sessions, Users}
import org.http4s.{Method, Request, Status, Uri}
import org.http4s.implicits.*
import org.http4s.circe.CirceEntityCodec.*
import org.mockito.ArgumentMatchers.{any, anyBoolean}
import org.mockito.Mockito.{verify, verifyNoInteractions, when}

class CategoryControllerSpec extends ControllerSpec {

  "A CategoryController" when {

    "Authentication fails" should {
      "return error when session has expired" in {
        val svc = mock[CategoryService[IO]]

        given auth: Authenticator[IO] = _ => IO.raiseError(ExpiredSession)

        val req = requestWithAuthHeader(uri"/categories")
        val res = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"Session has expired"}"""))
        verifyNoInteractions(svc)
      }

      "return error empty bearer token" in {
        val svc = mock[CategoryService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(uri"/categories", authHeaderValue = "Bearer ")
        val res = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"Invalid Bearer token"}"""))
        verifyNoInteractions(svc)
      }

      "return error on missing bearer token" in {
        val svc = mock[CategoryService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(uri"/categories", authHeaderValue = "foo")
        val res = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val responseBody = """{"message":"Invalid authorization header - The given value doesn't start with Bearer"}"""
        verifyJsonResponse(res, Status.Forbidden, Some(responseBody))
        verifyNoInteractions(svc)
      }

      "return error on missing auth header" in {
        val svc = mock[CategoryService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = Request[IO](uri = uri"/categories", method = Method.GET)
        val res = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Forbidden, Some("""{"message":"Missing authorization header"}"""))
        verifyNoInteractions(svc)
      }
    }

    "POST /categories" should {
      "create new cat and return 201 on success" in {
        val svc = mock[CategoryService[IO]]
        when(svc.create(any[CreateCategory])).thenReturn(IO.pure(Categories.cid))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson(s"""{"name":"${Categories.cname}","icon":"icon","kind":"expense","color":"#2962FF"}""")
        val req     = requestWithAuthHeader(uri"/categories", method = Method.POST).withEntity(reqBody)
        val res     = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Created, Some(s"""{"id":"${Categories.cid}"}"""))
        verify(svc).create(Categories.create())
      }

      "return 409 when cat name is taken" in {
        val svc = mock[CategoryService[IO]]
        when(svc.create(any[CreateCategory])).thenReturn(IO.raiseError(CategoryAlreadyExists(Categories.cname)))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson(s"""{"name":"${Categories.cname}","icon":"icon","kind":"expense","color":"#2962FF"}""")
        val req     = requestWithAuthHeader(uri"/categories", method = Method.POST).withEntity(reqBody)
        val res     = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Conflict, Some("""{"message":"A category with name cat-1 already exists"}"""))
        verify(svc).create(Categories.create())
      }

      "return 422 when invalid kind passed" in {
        val svc = mock[CategoryService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson("""{"name":"cat-1","icon":"icon","kind":"foo","color":"#2962FF"}""")
        val req     = requestWithAuthHeader(uri"/categories", method = Method.POST).withEntity(reqBody)
        val res     = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.UnprocessableEntity,
          Some("""{"message":"Invalid category kind foo"}""")
        )
        verifyNoInteractions(svc)
      }

      "return 422 when invalid color passed" in {
        val svc = mock[CategoryService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson("""{"name":"cat-1","icon":"icon","kind":"income","color":"blue"}""")
        val req     = requestWithAuthHeader(uri"/categories", method = Method.POST).withEntity(reqBody)
        val res     = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.UnprocessableEntity,
          Some("""{"message":"blue is not a valid color"}""")
        )
        verifyNoInteractions(svc)
      }
    }

    "GET /categories" should {
      "return user's categories" in {
        val svc = mock[CategoryService[IO]]
        when(svc.getAll(any[UserId])).thenReturn(IO.pure(List(Categories.cat())))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(uri"/categories", method = Method.GET)
        val res = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val responseBody = s"""[{"id":"${Categories.cid}","name":"${Categories.cname}","icon":"icon","kind":"expense","color":"#2962FF"}]"""
        verifyJsonResponse(res, Status.Ok, Some(responseBody))
        verify(svc).getAll(Users.uid1)
      }
    }

    "GET /categories/:id" should {
      "return user's category by id" in {
        val svc = mock[CategoryService[IO]]
        when(svc.get(any[UserId], any[CategoryId])).thenReturn(IO.pure(Categories.cat()))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/categories/${Categories.cid}"), method = Method.GET)
        val res = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val responseBody = s"""{"id":"${Categories.cid}","name":"${Categories.cname}","icon":"icon","kind":"expense","color":"#2962FF"}"""
        verifyJsonResponse(res, Status.Ok, Some(responseBody))
        verify(svc).get(Users.uid1, Categories.cid)
      }
    }

    "PUT /categories/:id/hidden" should {
      "update user's category hidden status" in {
        val svc = mock[CategoryService[IO]]
        when(svc.hide(any[UserId], any[CategoryId], anyBoolean)).thenReturn(IO.unit)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson("""{"hidden":true}""")
        val req     = requestWithAuthHeader(Uri.unsafeFromString(s"/categories/${Categories.cid}/hidden"), Method.PUT).withEntity(reqBody)
        val res     = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).hide(Users.uid1, Categories.cid, true)
      }
    }

    "PUT /categories/:id" should {
      "update user's category" in {
        val svc = mock[CategoryService[IO]]
        when(svc.update(any[Category])).thenReturn(IO.unit)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody =
          parseJson(s"""{"id":"${Categories.cid}","name":"${Categories.cname}","icon":"icon","kind":"expense","color":"#2962FF"}""")
        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/categories/${Categories.cid}"), method = Method.PUT).withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).update(Categories.cat())
      }

      "return 400 when provided ids do not match" in {
        val svc = mock[CategoryService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson(s"""{"id":"${Categories.cid2}","name":"c2","icon":"icon","kind":"expense","color":"#2962FF"}""")
        val req     = requestWithAuthHeader(Uri.unsafeFromString(s"/categories/${Categories.cid}"), method = Method.PUT).withEntity(reqBody)
        val res     = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val resBody = """{"message":"The id supplied in the path does not match with the id in the request body"}"""
        verifyJsonResponse(res, Status.BadRequest, Some(resBody))
        verifyNoInteractions(svc)
      }

      "return 422 when request has validation errors" in {
        val svc = mock[CategoryService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson(s"""{"id":"${Categories.cid}","name":"","icon":"icon","kind":"expense"}""")
        val req     = requestWithAuthHeader(Uri.unsafeFromString(s"/categories/${Categories.cid}"), method = Method.PUT).withEntity(reqBody)
        val res     = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val resBody = """{"message":"name must not be empty, color is required"}"""
        verifyJsonResponse(res, Status.UnprocessableEntity, Some(resBody))
        verifyNoInteractions(svc)
      }

      "return 404 when category does not exist" in {
        val svc = mock[CategoryService[IO]]
        when(svc.update(any[Category])).thenReturn(IO.raiseError(CategoryDoesNotExist(Categories.cid)))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody =
          parseJson(s"""{"id":"${Categories.cid}","name":"${Categories.cname}","icon":"icon","kind":"expense","color":"#2962FF"}""")
        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/categories/${Categories.cid}"), method = Method.PUT).withEntity(reqBody)
        val res = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val resBody = s"""{"message":"Category with id ${Categories.cid} does not exist"}"""
        verifyJsonResponse(res, Status.NotFound, Some(resBody))
        verify(svc).update(Categories.cat())
      }
    }

    "DELETE /categories/:id" should {
      "delete category by id" in {
        val svc = mock[CategoryService[IO]]
        when(svc.delete(any[UserId], any[CategoryId])).thenReturn(IO.unit)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/categories/${Categories.cid}"), method = Method.DELETE)
        val res = CategoryController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).delete(Users.uid1, Categories.cid)
      }
    }
  }
}
