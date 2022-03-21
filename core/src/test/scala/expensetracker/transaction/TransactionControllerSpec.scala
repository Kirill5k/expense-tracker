package expensetracker.transaction

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.Authenticator
import expensetracker.auth.user.UserId
import expensetracker.common.errors.AppError.{CategoryDoesNotExist, TransactionDoesNotExist}
import expensetracker.fixtures.{Categories, Sessions, Transactions, Users}
import org.http4s.circe.CirceEntityCodec.*
import org.http4s.implicits.*
import org.http4s.{Method, Request, Status, Uri}
import squants.market.GBP
import org.mockito.ArgumentMatchers.{any, anyBoolean}
import org.mockito.Mockito.{verify, verifyNoInteractions, when}

import java.time.LocalDate

class TransactionControllerSpec extends ControllerSpec {

  "A TransactionController" when {
    "POST /transactions" should {
      "create new tx" in {
        val svc = mock[TransactionService[IO]]
        when(svc.create(any[CreateTransaction])).thenReturn(IO.pure(Transactions.txid))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson(s"""{
            |"categoryId":"${Categories.cid}",
            |"kind":"expense",
            |"date": "${Transactions.txdate}",
            |"amount": {"value":15.0,"currency":{"code":"GBP","symbol":"£"}},
            |"note": "test tx",
            |"tags": ["foo"]
            |}""".stripMargin)
        val req = requestWithAuthHeader(uri"/transactions", Method.POST).withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Created, Some(s"""{"id":"${Transactions.txid}"}"""))
        verify(svc).create(Transactions.create())
      }

      "return 422 when invalid kind passed" in {
        val svc = mock[TransactionService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson("""{"name":"cat-1","icon":"icon","kind":"foo"}""")
        val req     = requestWithAuthHeader(uri"/transactions", Method.POST).withEntity(reqBody)
        val res     = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val responseBody = """{"message":"Invalid transaction kind foo, categoryId is required, amount is required, date is required"}"""
        verifyJsonResponse(res, Status.UnprocessableEntity, Some(responseBody))
        verifyNoInteractions(svc)
      }

      "return 422 when invalid category id passed" in {
        val svc = mock[TransactionService[IO]]
        when(svc.create(any[CreateTransaction])).thenReturn(IO.pure(Transactions.txid))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson("""{
                                  |"categoryId":"FOO",
                                  |"kind":"expense",
                                  |"date": "2021-01-01",
                                  |"amount": {"value":5.99,"currency":{"code":"GBP","symbol":"£"}}
                                  |}""".stripMargin)
        val req = requestWithAuthHeader(uri"/transactions", Method.POST).withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.UnprocessableEntity, Some("""{"message":"FOO is not a valid categoryId"}"""))
        verifyNoInteractions(svc)
      }
    }

    "GET /transactions" should {
      "return user's txs" in {
        val svc = mock[TransactionService[IO]]
        when(svc.getAll(any[UserId])).thenReturn(IO.pure(List(Transactions.tx())))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(uri"/transactions", Method.GET)
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Ok, Some(s"""[${Transactions.txjson}]"""))
        verify(svc).getAll(Users.uid1)
      }
    }

    "GET /transactions/:id" should {
      "find user's tx by id" in {
        val svc = mock[TransactionService[IO]]
        when(svc.get(any[UserId], any[TransactionId])).thenReturn(IO.pure(Transactions.tx()))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/transactions/${Transactions.txid}"), Method.GET)
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.Ok, Some(Transactions.txjson))
        verify(svc).get(Users.uid1, Transactions.txid)
      }

      "return 404 when tx does not exist" in {
        val svc = mock[TransactionService[IO]]
        when(svc.get(any[UserId], any[TransactionId])).thenReturn(IO.raiseError(TransactionDoesNotExist(Transactions.txid)))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/transactions/${Transactions.txid}"), Method.GET)
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.NotFound, Some(s"""{"message":"Transaction with id ${Transactions.txid} does not exist"}"""))
        verify(svc).get(Users.uid1, Transactions.txid)
      }
    }

    "PUT /transactions/:id/hidden" should {
      "update user's category hidden status" in {
        val svc = mock[TransactionService[IO]]
        when(svc.hide(any[UserId], any[TransactionId], anyBoolean)).thenReturn(IO.unit)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson("""{"hidden":true}""")
        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/transactions/${Transactions.txid}/hidden"), Method.PUT)
          .withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).hide(Users.uid1, Transactions.txid, true)
      }
    }

    "PUT /transactions/:id" should {

      "update user's transaction" in {
        val svc = mock[TransactionService[IO]]
        when(svc.update(any[Transaction])).thenReturn(IO.unit)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/transactions/${Transactions.txid}"), Method.PUT)
          .withEntity(parseJson(Transactions.txjson))
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).update(Transactions.tx())
      }

      "return 400 when provided ids do not match" in {
        val svc = mock[TransactionService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(uri"/transactions/AB0C5342AB0C5342AB0C5342", Method.PUT)
          .withEntity(parseJson(Transactions.txjson))
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val resBody = """{"message":"The id supplied in the path does not match with the id in the request body"}"""
        verifyJsonResponse(res, Status.BadRequest, Some(resBody))
        verifyNoInteractions(svc)
      }

      "return 422 when request has validation errors" in {
        val svc = mock[TransactionService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/transactions/${Transactions.txid}"), Method.PUT)
          .withEntity(parseJson("""{"id":"BC0C5342AB0C5342AB0C5342","categoryId":"foo"}"""))
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val resBody = """{"message":"kind is required, foo is not a valid categoryId, amount is required, date is required"}"""
        verifyJsonResponse(res, Status.UnprocessableEntity, Some(resBody))
        verifyNoInteractions(svc)
      }

      "return 404 when category does not exist" in {
        val svc = mock[TransactionService[IO]]
        when(svc.update(any[Transaction])).thenReturn(IO.raiseError(CategoryDoesNotExist(Categories.cid)))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/transactions/${Transactions.txid}"), Method.PUT)
          .withEntity(parseJson(Transactions.txjson))
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val resBody = s"""{"message":"Category with id ${Categories.cid} does not exist"}"""
        verifyJsonResponse(res, Status.NotFound, Some(resBody))
        verify(svc).update(Transactions.tx())
      }
    }

    "DELETE /transactions/:id" should {
      "delete tx by id" in {
        val svc = mock[TransactionService[IO]]
        when(svc.delete(any[UserId], any[TransactionId])).thenReturn(IO.unit)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/transactions/${Transactions.txid}"), Method.DELETE)
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).delete(Users.uid1, Transactions.txid)
      }
    }
  }
}
