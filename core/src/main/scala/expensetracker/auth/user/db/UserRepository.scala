package expensetracker.auth.user.db

import cats.effect.Async
import cats.implicits._
import expensetracker.auth.user.{PasswordHash, User, UserDetails, UserEmail, UserId, UserSettings}
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError.{AccountAlreadyExists, AccountDoesNotExist}
import expensetracker.common.json._
import io.circe.generic.auto._
import mongo4cats.circe._
import mongo4cats.database.operations.{Filter, Update}
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}

trait UserRepository[F[_]] extends Repository[F] {
  def find(aid: UserId): F[User]
  def findBy(email: UserEmail): F[Option[User]]
  def create(details: UserDetails, password: PasswordHash): F[UserId]
  def updateSettings(aid: UserId, settings: UserSettings): F[Unit]
  def updatePassword(aid: UserId)(password: PasswordHash): F[Unit]
}

final private class LiveUserRepository[F[_]: Async](
    private val collection: MongoCollectionF[AccountEntity]
) extends UserRepository[F] {

  override def findBy(email: UserEmail): F[Option[User]] =
    collection
      .find(Filter.eq(EmailField, email.value))
      .first[F]
      .map(ue => Option(ue).map(_.toDomain))

  override def create(details: UserDetails, password: PasswordHash): F[UserId] =
    collection
      .count[F](Filter.eq(EmailField, details.email.value))
      .flatMap {
        case 0 =>
          val createAcc = AccountEntity.create(details, password)
          collection.insertOne[F](createAcc).as(UserId(createAcc._id.toHexString))
        case _ =>
          AccountAlreadyExists(details.email).raiseError[F, UserId]
      }

  override def find(aid: UserId): F[User] =
    collection
      .find(idEq(aid.value))
      .first[F]
      .flatMap(errorIfNull[AccountEntity](AccountDoesNotExist(aid)))
      .map(_.toDomain)

  override def updateSettings(aid: UserId, settings: UserSettings): F[Unit] =
    collection
      .updateOne(idEq(aid.value), Update.set("settings", settings))
      .flatMap(errorIfNoMatches(AccountDoesNotExist(aid)))

  override def updatePassword(aid: UserId)(password: PasswordHash): F[Unit] =
    collection
      .updateOne(idEq(aid.value), Update.set("password", password.value))
      .flatMap(errorIfNoMatches(AccountDoesNotExist(aid)))
}

object UserRepository {
  def make[F[_]: Async](db: MongoDatabaseF[F]): F[UserRepository[F]] =
    db.getCollectionWithCodec[AccountEntity]("users")
      .map(_.withAddedCodec[UserSettings])
      .map(coll => new LiveUserRepository[F](coll))
}
