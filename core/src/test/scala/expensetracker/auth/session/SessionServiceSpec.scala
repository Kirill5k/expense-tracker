package expensetracker.auth.session

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.user.UserId
import expensetracker.auth.session.db.SessionRepository

import java.time.Instant

class SessionServiceSpec extends CatsSpec {

  "A SessionService" should {

    "create new session" in {
      val repo = mock[SessionRepository[IO]]
      when(repo.create(any[CreateSession])).thenReturn(IO.pure(sid))

      val create = CreateSession(uid, None, Instant.now())
      val result = for {
        svc <- SessionService.make(repo)
        sid <- svc.create(create)
      } yield sid

      result.unsafeToFuture().map { res =>
        verify(repo).create(create)
        res mustBe sid
      }
    }

    "return existing session" in {
      val repo = mock[SessionRepository[IO]]
      when(repo.find(any[SessionId], any[Option[SessionActivity]])).thenReturn(IO.pure(Some(sess)))

      val result = for {
        svc  <- SessionService.make(repo)
        sess <- svc.find(sid, sa)
      } yield sess

      result.unsafeToFuture().map { res =>
        verify(repo).find(sid, sa)
        res mustBe Some(sess)
      }
    }

    "unauth session" in {
      val repo = mock[SessionRepository[IO]]
      when(repo.unauth(sid)).thenReturn(IO.unit)

      val result = for {
        svc <- SessionService.make(repo)
        res <- svc.unauth(sid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).unauth(sid)
        res mustBe ()
      }
    }

    "invalidate all sessions" in {
      val repo = mock[SessionRepository[IO]]
      when(repo.invalidatedAll(any[UserId])).thenReturn(IO.unit)

      val result = for {
        svc <- SessionService.make(repo)
        res <- svc.invalidateAll(uid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).invalidatedAll(uid)
        res mustBe ()
      }
    }
  }
}
