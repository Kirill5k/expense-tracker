package expensetracker.auth.session

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.jwt.JwtEncoder
import expensetracker.auth.user.UserId
import expensetracker.auth.session.db.SessionRepository
import expensetracker.fixtures.{Sessions, Users}
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.{verify, verifyNoInteractions, when}

import java.time.Instant

class SessionServiceSpec extends CatsSpec {

  "A SessionService" should {

    "create new session" in {
      val jwtEnc = mock[JwtEncoder[IO]]
      val repo   = mock[SessionRepository[IO]]
      when(repo.create(any[CreateSession])).thenReturn(IO.pure(Sessions.sid))

      val result = for {
        svc <- SessionService.make(jwtEnc, repo)
        sid <- svc.create(Sessions.create())
      } yield sid

      result.unsafeToFuture().map { res =>
        verifyNoInteractions(jwtEnc)
        verify(repo).create(Sessions.create())
        res mustBe Sessions.sid
      }
    }

    "return existing session" in {
      val jwtEnc = mock[JwtEncoder[IO]]
      val repo   = mock[SessionRepository[IO]]
      when(repo.find(any[SessionId])).thenReturn(IO.pure(Some(Sessions.sess)))

      val result = for {
        svc  <- SessionService.make(jwtEnc, repo)
        sess <- svc.find(Sessions.sid)
      } yield sess

      result.unsafeToFuture().map { res =>
        verifyNoInteractions(jwtEnc)
        verify(repo).find(Sessions.sid)
        res mustBe Some(Sessions.sess)
      }
    }

    "unauth session" in {
      val jwtEnc = mock[JwtEncoder[IO]]
      val repo   = mock[SessionRepository[IO]]
      when(repo.unauth(Sessions.sid)).thenReturn(IO.unit)

      val result = for {
        svc <- SessionService.make(jwtEnc, repo)
        res <- svc.unauth(Sessions.sid)
      } yield res

      result.unsafeToFuture().map { res =>
        verifyNoInteractions(jwtEnc)
        verify(repo).unauth(Sessions.sid)
        res mustBe ()
      }
    }

    "invalidate all sessions" in {
      val jwtEnc = mock[JwtEncoder[IO]]
      val repo   = mock[SessionRepository[IO]]
      when(repo.invalidatedAll(any[UserId])).thenReturn(IO.unit)

      val result = for {
        svc <- SessionService.make(jwtEnc, repo)
        res <- svc.invalidateAll(Users.uid1)
      } yield res

      result.unsafeToFuture().map { res =>
        verifyNoInteractions(jwtEnc)
        verify(repo).invalidatedAll(Users.uid1)
        res mustBe ()
      }
    }
  }
}
