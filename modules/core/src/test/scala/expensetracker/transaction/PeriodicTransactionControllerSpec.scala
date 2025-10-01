package expensetracker.transaction

import cats.effect.IO
import expensetracker.auth.Authenticator
import expensetracker.fixtures.{Accounts, Categories, PeriodicTransactions, Sessions}
import kirill5k.common.http4s.test.HttpRoutesWordSpec
import org.http4s.implicits.*
import org.http4s.{Method, Request, Status, Uri}

import java.time.LocalDate

class PeriodicTransactionControllerSpec extends HttpRoutesWordSpec {
  "A PeriodicTransactionController" when {
    "POST /periodic-transactions" should {
      "create new tx" in {
        val tx  = PeriodicTransactions.tx()
        val svc = mock[PeriodicTransactionService[IO]]
        when(svc.create(any[CreatePeriodicTransaction])).thenReturnIO(tx)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = Request[IO](uri = uri"/periodic-transactions", method = Method.POST)
          .withAuthHeader()
          .withBody(
            s"""{
               |"categoryId":"${Categories.cid}",
               |"accountId":"${Accounts.id}",
               |"recurrence": {
               |  "startDate": "${LocalDate.now}",
               |  "interval": 1,
               |  "frequency": "monthly"
               |},
               |"amount": {"value":15.0,"currency":{"code":"GBP","symbol":"£"}},
               |"note": "test tx",
               |"tags": ["Foo"]
               |}""".stripMargin
          )
        val res = PeriodicTransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Created, Some(PeriodicTransactions.txjson))
        verify(svc).create(PeriodicTransactions.create())
      }

      "return 422 error when endDate is before startDate" in {
        val tx  = PeriodicTransactions.tx()
        val svc = mock[PeriodicTransactionService[IO]]
        when(svc.create(any[CreatePeriodicTransaction])).thenReturnIO(tx)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = Request[IO](uri = uri"/periodic-transactions", method = Method.POST)
          .withAuthHeader()
          .withBody(
            s"""{
               |"categoryId":"${Categories.cid}",
               |"recurrence": {
               |  "startDate": "${LocalDate.now}",
               |  "endDate": "${LocalDate.now.minusDays(1)}",
               |  "interval": 1,
               |  "frequency": "monthly"
               |},
               |"amount": {"value":15.0,"currency":{"code":"GBP","symbol":"£"}},
               |"note": "test tx",
               |"tags": ["Foo"]
               |}""".stripMargin
          )
        val res = PeriodicTransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.UnprocessableContent, Some("""{"message": "end date must be after start date"}"""))
        verifyNoInteractions(svc)
      }

      "return 422 error when interval is 0" in {
        val tx  = PeriodicTransactions.tx()
        val svc = mock[PeriodicTransactionService[IO]]
        when(svc.create(any[CreatePeriodicTransaction])).thenReturnIO(tx)

        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val req = Request[IO](uri = uri"/periodic-transactions", method = Method.POST)
          .withAuthHeader()
          .withBody(
            s"""{
               |"categoryId":"${Categories.cid}",
               |"recurrence": {
               |  "startDate": "${LocalDate.now}",
               |  "interval": 0,
               |  "frequency": "monthly"
               |},
               |"amount": {"value":15.0,"currency":{"code":"GBP","symbol":"£"}},
               |"note": "test tx",
               |"tags": ["Foo"]
               |}""".stripMargin
          )
        val res = PeriodicTransactionController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.UnprocessableContent, Some("""{"message": "0 is smaller than 1"}"""))
        verifyNoInteractions(svc)
      }
    }
  }
}
