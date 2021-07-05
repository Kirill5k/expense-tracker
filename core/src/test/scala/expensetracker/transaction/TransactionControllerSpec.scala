package expensetracker.transaction

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.account.AccountId
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import org.http4s.circe.CirceEntityCodec._
import org.http4s.implicits._
import org.http4s.{Method, Request, Status}
import squants.market.GBP

import java.time.Instant

class TransactionControllerSpec extends ControllerSpec {

  "A TransactionController" when {
    "POST /transactions" should {
      "create new tx" in {
        val svc = mock[TransactionService[IO]]
        when(svc.create(any[CreateTransaction])).thenReturn(IO.pure(txid))

        val reqBody = parseJson("""{
            |"categoryId":"AB0C5342AB0C5342AB0C5342",
            |"kind":"expense",
            |"date": "2021-01-01",
            |"amount": {"value":5.99,"currency":{"code":"GBP","symbol":"£"}}
            |}""".stripMargin)
        val req = Request[IO](uri = uri"/transactions", method = Method.POST).addCookie(sessIdCookie).withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Created, Some(s"""{"id":"${txid.value}"}"""))
        verify(svc).create(
          CreateTransaction(aid, TransactionKind.Expense, cid, GBP(5.99), Instant.parse("2021-01-01T00:00:00Z"), None)
        )
      }

      "return 422 when invalid kind passed" in {
        val svc = mock[TransactionService[IO]]

        val reqBody = parseJson("""{"name":"cat-1","icon":"icon","kind":"foo"}""")
        val req =
          Request[IO](uri = uri"/transactions", method = Method.POST).addCookie(sessIdCookie).withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.UnprocessableEntity,
          Some(s"""{"message":"invalid transaction kind foo: Field(kind)"}""")
        )
        verifyZeroInteractions(svc)
      }

      "return 422 when invalid category id passed" in {
        val svc = mock[TransactionService[IO]]
        when(svc.create(any[CreateTransaction])).thenReturn(IO.pure(txid))

        val reqBody = parseJson("""{
                                  |"categoryId":"FOO",
                                  |"kind":"expense",
                                  |"date": "2021-01-01",
                                  |"amount": {"value":5.99,"currency":{"code":"GBP","symbol":"£"}}
                                  |}""".stripMargin)
        val req = Request[IO](uri = uri"/transactions", method = Method.POST).addCookie(sessIdCookie).withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(
          res,
          Status.UnprocessableEntity,
          Some(s"""{"message":"Validation failed: (FOO is valid id).: Field(categoryId)"}""")
        )
        verifyZeroInteractions(svc)
      }
    }

    "GET /transactions" should {
      "return user's txs" in {
        val svc = mock[TransactionService[IO]]
        when(svc.getAll(any[AccountId])).thenReturn(IO.pure(List(tx)))

        val req = Request[IO](uri = uri"/transactions", method = Method.GET).addCookie(sessIdCookie)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """[
          |  {
          |    "id" : "BC0C5342AB0C5342AB0C5342",
          |    "kind" : "expense",
          |    "categoryId" : "AB0C5342AB0C5342AB0C5342",
          |    "amount" : {
          |      "value" : 10.99,
          |      "currency":{"code":"GBP","symbol":"£"}
          |    },
          |    "date" : "2021-06-06T00:00:00Z",
          |    "note" : "test tx"
          |  }
          |]""".stripMargin

        verifyJsonResponse(res, Status.Ok, Some(resBody))
        verify(svc).getAll(aid)
      }
    }

    "GET /transactions/:id" should {
      "find user's tx by id" in {
        val svc = mock[TransactionService[IO]]
        when(svc.get(any[AccountId], any[TransactionId])).thenReturn(IO.pure(tx))

        val req = Request[IO](uri = uri"/transactions/BC0C5342AB0C5342AB0C5342", method = Method.GET).addCookie(sessIdCookie)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """{
                        |"id" : "BC0C5342AB0C5342AB0C5342",
                        |"kind" : "expense",
                        |"categoryId" : "AB0C5342AB0C5342AB0C5342",
                        |"amount" : {
                        |  "value" : 10.99,
                        |  "currency":{"code":"GBP","symbol":"£"}
                        |},
                        |"date" : "2021-06-06T00:00:00Z",
                        |"note" : "test tx"
                        |}""".stripMargin

        verifyJsonResponse(res, Status.Ok, Some(resBody))
        verify(svc).get(aid,  txid)
      }

      "return 404 when tx does not exist" in {
        val svc = mock[TransactionService[IO]]
        when(svc.get(any[AccountId], any[TransactionId])).thenReturn(IO.raiseError(TransactionDoesNotExist(txid)))

        val req = Request[IO](uri = uri"/transactions/BC0C5342AB0C5342AB0C5342", method = Method.GET).addCookie(sessIdCookie)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NotFound, Some("""{"message":"transaction with id BC0C5342AB0C5342AB0C5342 does not exist"}"""))
        verify(svc).get(aid,  txid)
      }
    }

    "PUT /transactions/:id" should {

      val reqBodyJson = """{
                      |"id" : "BC0C5342AB0C5342AB0C5342",
                      |"kind" : "expense",
                      |"categoryId" : "AB0C5342AB0C5342AB0C5342",
                      |"amount" : {
                      |  "value" : 10.99,
                      |  "currency":{"code":"GBP","symbol":"£"}
                      |},
                      |"date" : "2021-06-06",
                      |"note" : "test tx"
                      |}""".stripMargin

      "update user's category" in {
        val svc = mock[TransactionService[IO]]
        when(svc.update(any[Transaction])).thenReturn(IO.unit)

        val reqBody = parseJson(reqBodyJson)
        val req = Request[IO](uri = uri"/transactions/BC0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).update(tx)
      }

      "return 400 when provided ids do not match" in {
        val svc = mock[TransactionService[IO]]

        val reqBody = parseJson(reqBodyJson)
        val req = Request[IO](uri = uri"/transactions/AB0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """{"message":"the id supplied in the path does not match with the id in the request body"}"""
        verifyJsonResponse(res, Status.BadRequest, Some(resBody))
        verifyZeroInteractions(svc)
      }

      "return 422 when request has validation errors" in {
        val svc = mock[TransactionService[IO]]

        val reqBody = parseJson("""{"id":"BC0C5342AB0C5342AB0C5342","categoryId":"foo"}""")
        val req = Request[IO](uri = uri"/transactions/BC0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """{"message":"Attempt to decode value on failed cursor: Field(kind)"}"""
        verifyJsonResponse(res, Status.UnprocessableEntity, Some(resBody))
        verifyZeroInteractions(svc)
      }

      "return 404 when category does not exist" in {
        val svc = mock[TransactionService[IO]]
        when(svc.update(any[Transaction])).thenReturn(IO.raiseError(TransactionDoesNotExist(txid)))

        val reqBody = parseJson(reqBodyJson)
        val req = Request[IO](uri = uri"/transactions/BC0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """{"message":"transaction with id BC0C5342AB0C5342AB0C5342 does not exist"}"""
        verifyJsonResponse(res, Status.NotFound, Some(resBody))
        verify(svc).update(tx)
      }
    }

    "DELETE /transactions/:id" should {
      "delete tx by id" in {
        val svc = mock[TransactionService[IO]]
        when(svc.delete(any[AccountId], any[TransactionId])).thenReturn(IO.unit)

        val req = Request[IO](uri = uri"/transactions/AB0C5342AB0C5342AB0C5342", method = Method.DELETE)
          .addCookie(sessIdCookie)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).delete(aid, TransactionId("AB0C5342AB0C5342AB0C5342"))
      }
    }
  }
}
