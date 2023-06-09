package expensetracker.auth.user.db

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import cats.syntax.applicativeError.*
import expensetracker.auth.user.{PasswordHash, User, UserDetails, UserEmail, UserId, UserSettings}
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError.{AccountAlreadyExists, AccountDoesNotExist}
import expensetracker.common.effects.*
import mongo4cats.circe.MongoJsonCodecs
import mongo4cats.operations.{Filter, Update}
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase

trait UserRepository[F[_]] extends Repository[F]:
  def find(uid: UserId): F[User]
  def findBy(email: UserEmail): F[Option[User]]
  def create(details: UserDetails, password: PasswordHash): F[UserId]
  def updateSettings(uid: UserId, settings: UserSettings): F[Unit]
  def updatePassword(uid: UserId)(password: PasswordHash): F[Unit]

final private class LiveUserRepository[F[_]](
    private val collection: MongoCollection[F, UserEntity]
)(using
    F: Async[F]
) extends UserRepository[F] {

  override def findBy(email: UserEmail): F[Option[User]] =
    collection
      .find(Filter.eq(Field.Email, email.value))
      .first
      .mapOpt(_.toDomain)

  override def create(details: UserDetails, password: PasswordHash): F[UserId] =
    collection
      .count(Filter.eq(Field.Email, details.email.value))
      .flatMap {
        case 0 =>
          val createAcc = UserEntity.create(details, password)
          collection.insertOne(createAcc).as(UserId(createAcc._id.toHexString))
        case _ =>
          AccountAlreadyExists(details.email).raiseError[F, UserId]
      }

  override def find(uid: UserId): F[User] =
    collection
      .find(idEq(uid.toObjectId))
      .first
      .flatMap(user => F.fromOption(user.map(_.toDomain), AccountDoesNotExist(uid)))

  override def updateSettings(uid: UserId, settings: UserSettings): F[Unit] =
    collection
      .updateOne(idEq(uid.toObjectId), Update.set(Field.Settings, settings))
      .flatMap(errorIfNoMatches(AccountDoesNotExist(uid)))

  override def updatePassword(uid: UserId)(password: PasswordHash): F[Unit] =
    collection
      .updateOne(idEq(uid.toObjectId), Update.set(Field.Password, password.value))
      .flatMap(errorIfNoMatches(AccountDoesNotExist(uid)))
}

object UserRepository extends MongoJsonCodecs:
  def make[F[_]: Async](db: MongoDatabase[F]): F[UserRepository[F]] =
    db.getCollectionWithCodec[UserEntity]("users")
      .map(_.withAddedCodec[UserSettings])
      .map(coll => LiveUserRepository[F](coll))
