package expensetracker.account.db

import expensetracker.account.{Account, AccountId, AccountName, CreateAccount}
import expensetracker.auth.user.UserId
import expensetracker.common.json.given
import io.circe.Codec
import mongo4cats.bson.ObjectId
import mongo4cats.circe.given
import squants.market.Currency

import java.time.Instant

final case class AccountEntity(
    _id: ObjectId,
    userId: ObjectId,
    name: String,
    currency: Currency,
    createdAt: Option[Instant],
    lastUpdatedAt: Option[Instant],
    hidden: Option[Boolean]
) derives Codec.AsObject {
  def toDomain: Account =
    Account(
      id = AccountId(_id),
      userId = UserId(userId),
      name = AccountName(name),
      currency = currency,
      createdAt = createdAt,
      lastUpdatedAt = lastUpdatedAt,
      hidden = hidden
    )
}

object AccountEntity:
  def from(account: CreateAccount): AccountEntity =
    AccountEntity(
      _id = ObjectId.gen,
      userId = account.userId.toObjectId,
      name = account.name.value,
      currency = account.currency,
      createdAt = Some(Instant.now),
      lastUpdatedAt = None,
      hidden = None
    )