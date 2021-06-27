package expensetracker.transaction

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.account.AccountId
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
            |"amount": {"value":5.99,"currency":"GBP"}
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
        val req = Request[IO](uri = uri"/transactions", method = Method.POST).addCookie(sessIdCookie).withEntity(reqBody)
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
                                  |"amount": {"value":5.99,"currency":"GBP"}
                                  |}""".stripMargin)
        val req = Request[IO](uri = uri"/transactions", method = Method.POST).addCookie(sessIdCookie).withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.UnprocessableEntity, Some(s"""{"message":"Validation failed: (FOO is valid id).: Field(categoryId)"}"""))
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
          |      "currency" : "GBP"
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
        pending
      }
    }

    "PUT /transactions/:id" should {
      "update user's tx" in {
        pending
      }

      "return 400 when provided ids do not match" in {
        pending
      }

      "return 422 when request has validation errors" in {
        pending
      }

      "return 404 when tx does not exist" in {
        pending
      }
    }

    "DELETE /transactions/:id" should {
      "delete tx by id" in {
        pending
      }
    }
  }
}
