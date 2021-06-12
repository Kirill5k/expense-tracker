package expensetracker.auth.account.db

import cats.effect.{Async, Sync}
import cats.implicits._
import com.mongodb.client.model.Filters
import expensetracker.auth.account.{Account, AccountEmail, AccountId, PasswordHash}
import expensetracker.common.errors.AppError.AccountAlreadyExists
import mongo4cats.client.MongoClientF
import mongo4cats.database.MongoCollectionF

trait AccountRepository[F[_]] {
  def find(email: AccountEmail): F[Option[Account]]
  def create(email: AccountEmail, password: PasswordHash): F[AccountId]
}

final private class LiveAccountRepository[F[_]: Async](
    private val collection: MongoCollectionF[AccountEntity]
) extends AccountRepository[F] {

  override def find(email: AccountEmail): F[Option[Account]] =
    collection
      .find(Filters.eq("email", email.value))
      .first[F]
      .map(ue => Option(ue).map(_.toDomain))

  override def create(email: AccountEmail, password: PasswordHash): F[AccountId] =
    collection
      .count[F](Filters.eq("email", email.value))
      .flatMap {
        case 0 =>
          val createAcc = AccountEntity.create(email, password)
          collection.insertOne[F](createAcc).as(AccountId(createAcc.id.toHexString))
        case _ =>
          AccountAlreadyExists(email).raiseError[F, AccountId]
      }
}

object AccountRepository {
  def make[F[_]: Sync](client: MongoClientF[F]): F[AccountRepository[F]] = ???
}
