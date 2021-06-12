package expensetracker.auth.session

import cats.Monad
import expensetracker.auth.account.AccountId
import expensetracker.auth.session.db.SessionRepository

import scala.concurrent.duration.FiniteDuration

trait SessionService[F[_]] {
  def create(aid: AccountId, duration: FiniteDuration): F[SessionId]
  def find(sid: SessionId): F[Option[Session]]
  def delete(sid: SessionId): F[Unit]
}

final private class LiveSessionService[F[_]](
    private val repository: SessionRepository[F]
) extends SessionService[F] {

  override def create(aid: AccountId, duration: FiniteDuration): F[SessionId] =
    repository.create(aid, duration)

  override def find(sid: SessionId): F[Option[Session]] =
    repository.find(sid)

  override def delete(sid: SessionId): F[Unit] =
    repository.delete(sid)
}

object SessionService {
  def make[F[_]: Monad](repo: SessionRepository[F]): F[SessionService[F]] =
    Monad[F].pure(new LiveSessionService[F](repo))
}
