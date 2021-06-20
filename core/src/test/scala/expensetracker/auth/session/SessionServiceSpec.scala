package expensetracker.auth.session

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.session.db.SessionRepository

import java.time.Instant

class SessionServiceSpec extends CatsSpec {

  "A SessionService" should {

    "create new session" in {
      val repo = mock[SessionRepository[IO]]
      when(repo.create(any[CreateSession])).thenReturn(IO.pure(sid))

      val create = CreateSession(aid, None, Instant.now())
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
