package expensetracker.auth.user.db

import cats.effect.Sync
import expensetracker.auth.user.{PasswordHash, User, UserId, UserName}
import mongo4cats.client.MongoClientF

trait UserRepository[F[_]] {
  def find(username: UserName): F[Option[User]]
  def create(username: UserName, password: PasswordHash): F[UserId]
}

object UserRepository {
  def make[F[_]: Sync](client: MongoClientF[F]): F[UserRepository[F]] = ???
}
