package expensetracker.auth.session

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.account.AccountId
import expensetracker.auth.session.db.SessionRepository

import scala.concurrent.duration._

class SessionServiceSpec extends CatsSpec {

  "A SessionService" should {

    "create new session" in {
      val repo = mock[SessionRepository[IO]]
      when(repo.create(any[AccountId], any[FiniteDuration])).thenReturn(IO.pure(sid))

      val result = for {
        svc <- SessionService.make(repo)
        sid <- svc.create(aid, 90.days)
      } yield sid

      result.unsafeToFuture().map { res =>
        verify(repo).create(aid, 90.days)
        res mustBe sid
      }
    }

    "return existing session" in {
      val repo = mock[SessionRepository[IO]]
      when(repo.find(any[SessionId])).thenReturn(IO.pure(Some(sess)))

      val result = for {
        svc  <- SessionService.make(repo)
        sess <- svc.find(sid)
      } yield sess

      result.unsafeToFuture().map { res =>
        verify(repo).find(sid)
        res mustBe Some(sess)
      }
    }

    "delete session" in {
      val repo = mock[SessionRepository[IO]]
      when(repo.delete(sid)).thenReturn(IO.unit)

      val result = for {
        svc <- SessionService.make(repo)
        res <- svc.delete(sid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).delete(sid)
        res mustBe ()
      }
    }
  }
}
