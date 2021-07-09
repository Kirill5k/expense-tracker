package expensetracker.auth.account.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.{Filters, Updates}
import expensetracker.auth.account.{Account, AccountDetails, AccountEmail, AccountId, AccountSettings, PasswordHash}
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError.{AccountAlreadyExists, AccountDoesNotExist}
import expensetracker.common.json._
import io.circe.generic.auto._
import io.circe.syntax._
import mongo4cats.circe._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}
import org.bson.Document

trait AccountRepository[F[_]] extends Repository[F] {
  def find(aid: AccountId): F[Account]
  def findBy(email: AccountEmail): F[Option[Account]]
  def create(details: AccountDetails, password: PasswordHash): F[AccountId]
  def updateSettings(aid: AccountId, settings: AccountSettings): F[Unit]
  def updatePassword(aid: AccountId)(password: PasswordHash): F[Unit]
}

final private class LiveAccountRepository[F[_]: Async](
    private val collection: MongoCollectionF[AccountEntity]
) extends AccountRepository[F] {

  override def findBy(email: AccountEmail): F[Option[Account]] =
    collection
      .find(Filters.eq(EmailField, email.value))
      .first[F]
      .map(ue => Option(ue).map(_.toDomain))

  override def create(details: AccountDetails, password: PasswordHash): F[AccountId] =
    collection
      .count[F](Filters.eq(EmailField, details.email.value))
      .flatMap {
        case 0 =>
          val createAcc = AccountEntity.create(details, password)
          collection.insertOne[F](createAcc).as(AccountId(createAcc._id.toHexString))
        case _ =>
          AccountAlreadyExists(details.email).raiseError[F, AccountId]
      }

  override def find(aid: AccountId): F[Account] =
    collection
      .find(idEq(IdField, aid.value))
      .first[F]
      .flatMap(errorIfNull[AccountEntity](AccountDoesNotExist(aid)))
      .map(_.toDomain)

  override def updateSettings(aid: AccountId, settings: AccountSettings): F[Unit] =
    collection
      .updateOne(idEq(IdField, aid.value), Updates.set("settings", Document.parse(settings.asJson.noSpaces)))
      .flatMap(errorIfNoMatches(AccountDoesNotExist(aid)))

  override def updatePassword(aid: AccountId)(password: PasswordHash): F[Unit] =
    collection
      .updateOne(idEq(IdField, aid.value), Updates.set("password", password.value))
      .flatMap(errorIfNoMatches(AccountDoesNotExist(aid)))
}

object AccountRepository {
  def make[F[_]: Async](db: MongoDatabaseF[F]): F[AccountRepository[F]] =
    db.getCollectionWithCirceCodecs[AccountEntity]("accounts")
      .map(coll => new LiveAccountRepository[F](coll))
}
