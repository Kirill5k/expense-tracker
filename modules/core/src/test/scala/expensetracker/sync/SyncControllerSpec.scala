package expensetracker.sync

import cats.effect.IO
import expensetracker.auth.Authenticator
import expensetracker.auth.user.{User, UserId}
import expensetracker.category.Category
import expensetracker.transaction.Transaction
import expensetracker.fixtures.{Categories, Sessions, Transactions, Users}
import kirill5k.common.http4s.test.HttpRoutesWordSpec
import org.http4s.{Method, Request, Status, Uri}
import org.http4s.implicits.*
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

import java.time.Instant
import java.time.temporal.ChronoUnit

class SyncControllerSpec extends HttpRoutesWordSpec {
  val time = Instant.now.truncatedTo(ChronoUnit.SECONDS)

  val changesJson =
    s"""{
       |    "state" : {
       |      "created" : [
       |      ],
       |      "updated" : [
       |        { "id": "expense-tracker", "user_id" : "${Users.uid1}" }
       |      ],
       |      "deleted" : [
       |      ]
       |    },
       |    "transactions" : {
       |      "created" : [
       |        {
       |          "id" : "${Transactions.txid}",
       |          "category_id" : "${Categories.cid}",
       |          "parent_transaction_id" : null,
       |          "is_recurring" : false,
       |          "amount_value" : 15.0,
       |          "amount_currency_code" : "GBP",
       |          "amount_currency_symbol" : "£",
       |          "date" : "${Transactions.txdate}",
       |          "note" : "test tx",
       |          "tags" : "foo",
       |          "hidden" : false,
       |          "user_id" : "${Users.uid1}"
       |        }
       |      ],
       |      "updated" : [
       |        {
       |          "id" : "${Transactions.txid2}",
       |          "category_id" : "${Categories.cid}",
       |          "parent_transaction_id" : null,
       |          "is_recurring" : false,
       |          "amount_value" : 15.0,
       |          "amount_currency_code" : "GBP",
       |          "amount_currency_symbol" : "£",
       |          "date" : "${Transactions.txdate}",
       |          "note" : "test tx",
       |          "tags" : "foo",
       |          "hidden" : false,
       |          "user_id" : "${Users.uid1}"
       |        }
       |      ],
       |      "deleted" : [
       |      ]
       |    },
       |    "categories" : {
       |      "created" : [
       |        {
       |          "id" : "${Categories.cid}",
       |          "name" : "cat-1",
       |          "icon" : "icon",
       |          "kind" : "expense",
       |          "color" : "#2962FF",
       |          "hidden" : false,
       |          "user_id" : "${Users.uid1}"
       |        }
       |      ],
       |      "updated" : [
       |        {
       |          "id" : "${Categories.cid2}",
       |          "name" : "cat-1",
       |          "icon" : "icon",
       |          "kind" : "expense",
       |          "color" : "#2962FF",
       |          "hidden" : false,
       |          "user_id" : "${Users.uid1}"
       |        }
       |      ],
       |      "deleted" : [
       |      ]
       |    },
       |    "users" : {
       |      "updated" : [
       |      ],
       |      "created" : [
       |        {
       |          "id" : "${Users.uid1}",
       |          "first_name" : "John",
       |          "last_name" : "Bloggs",
       |          "email" : "acc1@et.com",
       |          "settings_currency_code" : "GBP",
       |          "settings_currency_symbol" : "£",
       |          "settings_future_transaction_visibility_days" : null,
       |          "settings_dark_mode" : null,
       |          "registration_date" : "${Users.regDate}"
       |        }
       |      ],
       |      "deleted" : [
       |      ]
       |    }
       |  }""".stripMargin

  "SyncController" when {
    given logger: Logger[IO] = Slf4jLogger.getLogger[IO]

    "GET /sync/watermelon" should {

      "pull changes" in {
        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val svc = mock[SyncService[IO]]
        when(svc.pullChanges(any[UserId], anyOpt[Instant]))
          .thenReturnIO(
            DataChanges(
              transactions = DataChange(created = List(Transactions.tx()), updated = List(Transactions.tx(Transactions.txid2))),
              categories = DataChange(created = List(Categories.cat()), updated = List(Categories.cat(Categories.cid2))),
              users = DataChange(created = List(Users.user), updated = Nil),
              time = time
            )
          )

        val req = Request[IO](Method.GET, Uri.unsafeFromString(s"/sync/watermelon?lastPulledAt=${time.toEpochMilli}")).withAuthHeader()

        val res = SyncController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.Ok, Some(s"""{"changes" : $changesJson, "timestamp" : ${time.toEpochMilli}}"""))
        verify(svc).pullChanges(Users.uid1, Some(time))
      }
    }

    "POST /sync/watermelon" should {
      "return 204 on success" in {
        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess)

        val svc = mock[SyncService[IO]]
        when(svc.pushChanges(anyList[User], anyList[Category], anyList[Transaction])).thenReturnUnit

        val req = Request[IO](Method.POST, Uri.unsafeFromString(s"/sync/watermelon?lastPulledAt=${time.toEpochMilli}"))
          .withAuthHeader()
          .withBody(changesJson)

        val res = SyncController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus (Status.NoContent, None)
        verify(svc).pushChanges(
          List(),
          List(
            Categories.cat().copy(createdAt = Some(time), lastUpdatedAt = Some(time)),
            Categories.cat(Categories.cid2).copy(lastUpdatedAt = Some(time))
          ),
          List(
            Transactions.tx().copy(createdAt = Some(time), lastUpdatedAt = Some(time)),
            Transactions.tx(Transactions.txid2).copy(lastUpdatedAt = Some(time))
          )
        )
      }

      "not process data if it belongs to a different user" in {
        given auth: Authenticator[IO] = _ => IO.pure(Sessions.sess.copy(userId = Users.uid2))

        val svc = mock[SyncService[IO]]
        when(svc.pushChanges(anyList[User], anyList[Category], anyList[Transaction])).thenReturnUnit

        val req = Request[IO](Method.POST, Uri.unsafeFromString(s"/sync/watermelon?lastPulledAt=${time.toEpochMilli}"))
          .withAuthHeader()
          .withBody(changesJson)

        val res = SyncController.make[IO](svc).flatMap(_.routes.orNotFound.run(req))

        res mustHaveStatus(Status.NoContent, None)
        verify(svc).pushChanges(Nil, Nil, Nil)
      }
    }
  }
}
