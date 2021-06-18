package expensetracker.auth.account.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.Filters
import expensetracker.auth.account.{Account, AccountDetails, AccountEmail, AccountId, PasswordHash}
import expensetracker.common.errors.AppError.AccountAlreadyExists
import io.circe.generic.auto._
import mongo4cats.circe._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}

trait AccountRepository[F[_]] {
  def find(email: AccountEmail): F[Option[Account]]
  def create(details: AccountDetails, password: PasswordHash): F[AccountId]
}

final private class LiveAccountRepository[F[_]: Async](
    private val collection: MongoCollectionF[AccountEntity]
) extends AccountRepository[F] {

  override def find(email: AccountEmail): F[Option[Account]] =
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
}

object AccountRepository {
  def make[F[_]: Async](db: MongoDatabaseF[F]): F[AccountRepository[F]] =
    db.getCollectionWithCirceCodecs[AccountEntity]("accounts")
      .map(coll => new LiveAccountRepository[F](coll))
}
