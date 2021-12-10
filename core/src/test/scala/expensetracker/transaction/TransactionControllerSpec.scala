package expensetracker.transaction

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.user.UserId
import expensetracker.common.errors.AppError.TransactionDoesNotExist
import org.http4s.circe.CirceEntityCodec._
import org.http4s.implicits._
import org.http4s.{Method, Request, Status}
import squants.market.GBP
import org.mockito.ArgumentMatchers.{any, anyBoolean}
import org.mockito.Mockito.{verify, verifyNoInteractions, when}

import java.time.LocalDate

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
            |"amount": {"value":5.99,"currency":{"code":"GBP","symbol":"£"}},
            |"tags": ["foo"]
            |}""".stripMargin)
        val req = Request[IO](uri = uri"/transactions", method = Method.POST).addCookie(sessIdCookie).withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.Created, Some(s"""{"id":"${txid.value}"}"""))
        verify(svc).create(
          CreateTransaction(uid, TransactionKind.Expense, cid, GBP(5.99), LocalDate.parse("2021-01-01"), None, List("foo"))
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
          Some(s"""{"message":"Invalid transaction kind foo"}""")
        )
        verifyNoInteractions(svc)
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
          Some(s"""{"message":"FOO is not a valid categoryId"}""")
        )
        verifyNoInteractions(svc)
      }
    }

    "GET /transactions" should {
      "return user's txs" in {
        val svc = mock[TransactionService[IO]]
        when(svc.getAll(any[String].asInstanceOf[UserId])).thenReturn(IO.pure(List(tx)))

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
          |    "date" : "2021-06-06",
          |    "note" : "test tx",
          |    "tags" : ["test"]
          |  }
          |]""".stripMargin

        verifyJsonResponse(res, Status.Ok, Some(resBody))
        verify(svc).getAll(uid)
      }
    }

    "GET /transactions/:id" should {
      "find user's tx by id" in {
        val svc = mock[TransactionService[IO]]
        when(svc.get(any[String].asInstanceOf[UserId], any[String].asInstanceOf[TransactionId])).thenReturn(IO.pure(tx))

        val req = Request[IO](uri = uri"/transactions/BC0C5342AB0C5342AB0C5342", method = Method.GET).addCookie(sessIdCookie)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """{
                        |"id" : "BC0C5342AB0C5342AB0C5342",
                        |"kind" : "expense",
                        |"categoryId" : "AB0C5342AB0C5342AB0C5342",
                        |"amount" : {"value" : 10.99, "currency":{"code":"GBP","symbol":"£"}},
                        |"date" : "2021-06-06",
                        |"note" : "test tx",
                        |"tags" : ["test"]
                        |}""".stripMargin

        verifyJsonResponse(res, Status.Ok, Some(resBody))
        verify(svc).get(uid, txid)
      }

      "return 404 when tx does not exist" in {
        val svc = mock[TransactionService[IO]]
        when(svc.get(any[String].asInstanceOf[UserId], any[String].asInstanceOf[TransactionId]))
          .thenReturn(IO.raiseError(TransactionDoesNotExist(txid)))

        val req = Request[IO](uri = uri"/transactions/BC0C5342AB0C5342AB0C5342", method = Method.GET).addCookie(sessIdCookie)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NotFound, Some("""{"message":"Transaction with id BC0C5342AB0C5342AB0C5342 does not exist"}"""))
        verify(svc).get(uid, txid)
      }
    }

    "PUT /transactions/:id/hidden" should {
      "update user's category hidden status" in {
        val svc = mock[TransactionService[IO]]
        when(svc.hide(any[String].asInstanceOf[UserId], any[String].asInstanceOf[TransactionId], anyBoolean)).thenReturn(IO.unit)

        val reqBody = parseJson("""{"hidden":true}""")
        val req = Request[IO](uri = uri"/transactions/BC0C5342AB0C5342AB0C5342/hidden", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).hide(uid, txid, true)
      }
    }

    "PUT /transactions/:id" should {

      val reqBodyJson = """{
                      |"id" : "BC0C5342AB0C5342AB0C5342",
                      |"kind" : "expense",
                      |"categoryId" : "AB0C5342AB0C5342AB0C5342",
                      |"amount" : {"value" : 10.99,"currency":{"code":"GBP","symbol":"£"}},
                      |"date" : "2021-06-06",
                      |"note" : "test tx",
                      |"tags" : ["test"]
                      |}""".stripMargin

      "update user's transaction" in {
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

        val resBody = """{"message":"The id supplied in the path does not match with the id in the request body"}"""
        verifyJsonResponse(res, Status.BadRequest, Some(resBody))
        verifyNoInteractions(svc)
      }

      "return 422 when request has validation errors" in {
        val svc = mock[TransactionService[IO]]

        val reqBody = parseJson("""{"id":"BC0C5342AB0C5342AB0C5342","categoryId":"foo"}""")
        val req = Request[IO](uri = uri"/transactions/BC0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """{"message":"Kind is required"}"""
        verifyJsonResponse(res, Status.UnprocessableEntity, Some(resBody))
        verifyNoInteractions(svc)
      }

      "return 404 when category does not exist" in {
        val svc = mock[TransactionService[IO]]
        when(svc.update(any[Transaction])).thenReturn(IO.raiseError(TransactionDoesNotExist(txid)))

        val reqBody = parseJson(reqBodyJson)
        val req = Request[IO](uri = uri"/transactions/BC0C5342AB0C5342AB0C5342", method = Method.PUT)
          .addCookie(sessIdCookie)
          .withEntity(reqBody)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        val resBody = """{"message":"Transaction with id BC0C5342AB0C5342AB0C5342 does not exist"}"""
        verifyJsonResponse(res, Status.NotFound, Some(resBody))
        verify(svc).update(tx)
      }
    }

    "DELETE /transactions/:id" should {
      "delete tx by id" in {
        val svc = mock[TransactionService[IO]]
        when(svc.delete(any[String].asInstanceOf[UserId], any[String].asInstanceOf[TransactionId])).thenReturn(IO.unit)

        val req = Request[IO](uri = uri"/transactions/AB0C5342AB0C5342AB0C5342", method = Method.DELETE)
          .addCookie(sessIdCookie)
        val res = TransactionController.make[IO](svc).flatMap(_.routes(sessMiddleware(Some(sess))).orNotFound.run(req))

        verifyJsonResponse(res, Status.NoContent, None)
        verify(svc).delete(uid, TransactionId("AB0C5342AB0C5342AB0C5342"))
      }
    }
  }
}
