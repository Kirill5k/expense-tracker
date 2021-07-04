package expensetracker.auth.account.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.Filters
import expensetracker.auth.account.{Account, AccountDetails, AccountEmail, AccountId, PasswordHash}
import expensetracker.common.errors.AppError.{AccountAlreadyExists, AccountDoesNotExist}
import expensetracker.common.json._
import io.circe.generic.auto._
import mongo4cats.circe._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}
import org.bson.types.ObjectId

trait AccountRepository[F[_]] {
  def find(aid: AccountId): F[Account]
  def findBy(email: AccountEmail): F[Option[Account]]
  def create(details: AccountDetails, password: PasswordHash): F[AccountId]
}

final private class LiveAccountRepository[F[_]: Async](
    private val collection: MongoCollectionF[AccountEntity]
) extends AccountRepository[F] {

  override def findBy(email: AccountEmail): F[Option[Account]] =
    collection
      .find(Filters.eq("email", email.value))
      .first[F]
      .map(ue => Option(ue).map(_.toDomain))

  override def create(details: AccountDetails, password: PasswordHash): F[AccountId] =
    collection
      .count[F](Filters.eq("email", details.email.value))
      .flatMap {
        case 0 =>
          val createAcc = AccountEntity.create(details, password)
          collection.insertOne[F](createAcc).as(AccountId(createAcc._id.toHexString))
        case _ =>
          AccountAlreadyExists(details.email).raiseError[F, AccountId]
      }

  override def find(aid: AccountId): F[Account] =
    collection
      .find(Filters.eq("_id", new ObjectId(aid.value)))
      .first[F]
      .map(a => Option(a))
      .flatMap {
        case Some(ent) => ent.toDomain.pure[F]
        case None => AccountDoesNotExist(aid).raiseError[F, Account]
      }

}

object AccountRepository {
  def make[F[_]: Async](db: MongoDatabaseF[F]): F[AccountRepository[F]] =
    db.getCollectionWithCirceCodecs[AccountEntity]("accounts")
      .map(coll => new LiveAccountRepository[F](coll))
}
