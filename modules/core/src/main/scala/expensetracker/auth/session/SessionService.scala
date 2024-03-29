package expensetracker.auth.session

import cats.syntax.flatMap.*
import cats.syntax.functor.*
import cats.{Monad, MonadThrow}
import expensetracker.auth.jwt.{BearerToken, JwtEncoder, JwtToken}
import expensetracker.auth.user.UserId
import expensetracker.auth.session.db.SessionRepository
import expensetracker.common.errors.AppError

trait SessionService[F[_]]:
  def authenticate(token: BearerToken): F[Session]
  def create(cs: CreateSession): F[BearerToken]
  def find(sid: SessionId): F[Option[Session]]
  def unauth(sid: SessionId): F[Unit]
  def invalidateAll(uid: UserId): F[Unit]

final private class LiveSessionService[F[_]](
    private val jwtEncoder: JwtEncoder[F],
    private val repository: SessionRepository[F]
)(using
    F: MonadThrow[F]
) extends SessionService[F] {

  override def authenticate(token: BearerToken): F[Session] =
    for
      jwt          <- jwtEncoder.decode(token)
      maybeSession <- repository.find(jwt.sessionId)
      session      <- F.fromOption(maybeSession, AppError.SessionDoesNotExist(jwt.sessionId))
      _            <- F.ensure(F.pure(session.userId))(AppError.SomeoneElsesSession)(_ == jwt.userId)
      _            <- F.ensure(F.pure(session))(AppError.ExpiredSession)(_.active)
    yield session

  override def create(cs: CreateSession): F[BearerToken] =
    repository
      .create(cs)
      .flatMap(sid => jwtEncoder.encode(JwtToken(sid, cs.userId)))

  override def find(sid: SessionId): F[Option[Session]] =
    repository.find(sid)

  override def unauth(sid: SessionId): F[Unit] =
    repository.unauth(sid)

  override def invalidateAll(uid: UserId): F[Unit] =
    repository.invalidatedAll(uid)
}

object SessionService:
  def make[F[_]: MonadThrow](jwtEncoder: JwtEncoder[F], repo: SessionRepository[F]): F[SessionService[F]] =
    Monad[F].pure(LiveSessionService[F](jwtEncoder, repo))
