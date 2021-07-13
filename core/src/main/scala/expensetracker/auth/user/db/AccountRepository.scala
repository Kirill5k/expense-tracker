package expensetracker.auth.user.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.{Filters, Updates}
import expensetracker.auth.user.{User, UserDetails, UserEmail, UserId, UserSettings, PasswordHash}
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError.{AccountAlreadyExists, AccountDoesNotExist}
import expensetracker.common.json._
import io.circe.generic.auto._
import io.circe.syntax._
import mongo4cats.circe._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}
import org.bson.Document

trait AccountRepository[F[_]] extends Repository[F] {
  def find(aid: UserId): F[User]
  def findBy(email: UserEmail): F[Option[User]]
  def create(details: UserDetails, password: PasswordHash): F[UserId]
  def updateSettings(aid: UserId, settings: UserSettings): F[Unit]
  def updatePassword(aid: UserId)(password: PasswordHash): F[Unit]
}

final private class LiveAccountRepository[F[_]: Async](
    private val collection: MongoCollectionF[AccountEntity]
) extends AccountRepository[F] {

  override def findBy(email: UserEmail): F[Option[User]] =
    collection
      .find(Filters.eq(EmailField, email.value))
      .first[F]
      .map(ue => Option(ue).map(_.toDomain))

  override def create(details: UserDetails, password: PasswordHash): F[UserId] =
    collection
      .count[F](Filters.eq(EmailField, details.email.value))
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
      .updateOne(idEq(aid.value), Updates.set("settings", Document.parse(settings.asJson.noSpaces)))
      .flatMap(errorIfNoMatches(AccountDoesNotExist(aid)))

  override def updatePassword(aid: UserId)(password: PasswordHash): F[Unit] =
    collection
      .updateOne(idEq(aid.value), Updates.set("password", password.value))
      .flatMap(errorIfNoMatches(AccountDoesNotExist(aid)))
}

object AccountRepository {
  def make[F[_]: Async](db: MongoDatabaseF[F]): F[AccountRepository[F]] =
    db.getCollectionWithCirceCodecs[AccountEntity]("accounts")
      .map(coll => new LiveAccountRepository[F](coll))
}
