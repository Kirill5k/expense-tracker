package expensetracker.auth.session

import cats.Monad
import expensetracker.auth.account.AccountId
import expensetracker.auth.session.db.SessionRepository

trait SessionService[F[_]] {
  def create(cs: CreateSession): F[SessionId]
  def find(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]]
  def delete(sid: SessionId): F[Unit]
}

final private class LiveSessionService[F[_]](
    private val repository: SessionRepository[F]
) extends SessionService[F] {

  override def create(cs: CreateSession): F[SessionId] =
    repository.create(cs)

  override def find(sid: SessionId, activity: Option[SessionActivity]): F[Option[Session]] =
    repository.find(sid, activity)

  override def delete(sid: SessionId): F[Unit] =
    repository.delete(sid)
}

object SessionService {
  def make[F[_]: Monad](repo: SessionRepository[F]): F[SessionService[F]] =
    Monad[F].pure(new LiveSessionService[F](repo))
}
