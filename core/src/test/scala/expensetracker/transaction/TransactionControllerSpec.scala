package expensetracker.transaction

import cats.effect.IO
import expensetracker.ControllerSpec
import expensetracker.auth.Authenticator
import expensetracker.auth.user.UserId
import expensetracker.common.errors.AppError.{CategoryDoesNotExist, TransactionDoesNotExist}
import expensetracker.fixtures.{Categories, Sessions, Transactions, Users}
import org.http4s.implicits.*
import org.http4s.{Method, Status, Uri}
import org.mockito.ArgumentMatchers.{any, anyBoolean}
import org.mockito.Mockito.{verify, verifyNoInteractions, when}

import java.time.Instant

class TransactionControllerSpec extends ControllerSpec:
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
            |"tags": ["Foo"]
            |}""".stripMargin)
        val req = requestWithAuthHeader(uri"/transactions", Method.POST, body = Some(reqBody))
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Created, Some(s"""{"id":"${Transactions.txid}"}"""))
        verify(svc).create(Transactions.create())
      }

      "return 422 when invalid kind passed" in {
        val svc = mock[TransactionService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val reqBody = parseJson("""{"name":"cat-1","icon":"icon","kind":"foo"}""")
        val req     = requestWithAuthHeader(uri"/transactions", Method.POST, body = Some(reqBody))
        val res     = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val responseBody =
          """{"message":"Invalid value foo for enum TransactionKind, Accepted values: expense,income, categoryId is required, amount is required, date is required"}"""
        res mustHaveStatus (Status.UnprocessableEntity, Some(responseBody))
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
        val req = requestWithAuthHeader(uri"/transactions", Method.POST, body = Some(reqBody))
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.UnprocessableEntity, Some("""{"message":"FOO is not a valid categoryId"}"""))
        verifyNoInteractions(svc)
      }
    }

    "GET /transactions" should {
      "return user's txs" in {
        val svc = mock[TransactionService[IO]]
        when(svc.getAll(any[UserId], any[Option[Instant]], any[Option[Instant]])).thenReturn(IO.pure(List(Transactions.tx())))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(uri"/transactions", Method.GET)
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Ok, Some(s"""[${Transactions.txjson}]"""))
        verify(svc).getAll(Users.uid1, None, None)
      }

      "return user's txs with provided date ranges" in {
        val svc = mock[TransactionService[IO]]
        when(svc.getAll(any[UserId], any[Option[Instant]], any[Option[Instant]])).thenReturn(IO.pure(List(Transactions.tx())))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(uri"/transactions?from=2022-01-01T00:00:00Z&to=2023-01-01T00:00:00Z", Method.GET)
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus(Status.Ok, Some(s"""[${Transactions.txjson}]"""))
        verify(svc).getAll(Users.uid1, Some(Instant.parse("2022-01-01T00:00:00Z")), Some(Instant.parse("2023-01-01T00:00:00Z")))
      }
    }

    "GET /transactions/:id" should {
      "find user's tx by id" in {
        val svc = mock[TransactionService[IO]]
        when(svc.get(any[UserId], any[TransactionId])).thenReturn(IO.pure(Transactions.tx()))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/transactions/${Transactions.txid}"), Method.GET)
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Ok, Some(Transactions.txjson))
        verify(svc).get(Users.uid1, Transactions.txid)
      }

      "return 404 when tx does not exist" in {
        val svc = mock[TransactionService[IO]]
        when(svc.get(any[UserId], any[TransactionId])).thenReturn(IO.raiseError(TransactionDoesNotExist(Transactions.txid)))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(Uri.unsafeFromString(s"/transactions/${Transactions.txid}"), Method.GET)
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.NotFound, Some(s"""{"message":"Transaction with id ${Transactions.txid} does not exist"}"""))
        verify(svc).get(Users.uid1, Transactions.txid)
      }
    }

    "PUT /transactions/:id/hidden" should {
      "update user's category hidden status" in {
        val svc = mock[TransactionService[IO]]
        when(svc.hide(any[UserId], any[TransactionId], anyBoolean)).thenReturn(IO.unit)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(
          Uri.unsafeFromString(s"/transactions/${Transactions.txid}/hidden"),
          Method.PUT,
          body = Some(parseJson("""{"hidden":true}"""))
        )
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.NoContent, None)
        verify(svc).hide(Users.uid1, Transactions.txid, true)
      }
    }

    "PUT /transactions/:id" should {

      "update user's transaction" in {
        val svc = mock[TransactionService[IO]]
        when(svc.update(any[Transaction])).thenReturn(IO.unit)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(
          Uri.unsafeFromString(s"/transactions/${Transactions.txid}"),
          Method.PUT,
          body = Some(parseJson(Transactions.txjson))
        )
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.NoContent, None)
        verify(svc).update(Transactions.tx())
      }

      "return 400 when provided ids do not match" in {
        val svc = mock[TransactionService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(
          uri"/transactions/AB0C5342AB0C5342AB0C5342",
          Method.PUT,
          body = Some(parseJson(Transactions.txjson))
        )
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val resBody = """{"message":"The id supplied in the path does not match with the id in the request body"}"""
        res mustHaveStatus (Status.BadRequest, Some(resBody))
        verifyNoInteractions(svc)
      }

      "return 422 when request has validation errors" in {
        val svc = mock[TransactionService[IO]]

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(
          Uri.unsafeFromString(s"/transactions/${Transactions.txid}"),
          Method.PUT,
          body = Some(parseJson("""{"id":"BC0C5342AB0C5342AB0C5342","categoryId":"foo"}"""))
        )
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val resBody = """{"message":"kind is required, foo is not a valid categoryId, amount is required, date is required"}"""
        res mustHaveStatus (Status.UnprocessableEntity, Some(resBody))
        verifyNoInteractions(svc)
      }

      "return 404 when category does not exist" in {
        val svc = mock[TransactionService[IO]]
        when(svc.update(any[Transaction])).thenReturn(IO.raiseError(CategoryDoesNotExist(Categories.cid)))

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = requestWithAuthHeader(
          Uri.unsafeFromString(s"/transactions/${Transactions.txid}"),
          Method.PUT,
          body = Some(parseJson(Transactions.txjson))
        )
        val res = TransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        val resBody = s"""{"message":"Category with id ${Categories.cid} does not exist"}"""
        res mustHaveStatus (Status.NotFound, Some(resBody))
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

        res mustHaveStatus (Status.NoContent, None)
        verify(svc).delete(Users.uid1, Transactions.txid)
      }
    }
  }
