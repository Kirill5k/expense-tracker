package expensetracker.accounts

import expensetracker.auth.user.UserId
import expensetracker.common.types.{IdType, StringType}
import squants.market.Currency

import java.time.Instant

opaque type AccountId = String
object AccountId extends IdType[AccountId]

opaque type AccountName = String
object AccountName extends StringType[AccountName]

final case class Account(
    id: AccountId,
    userId: UserId,
    name: AccountName,
    currency: Currency,
    createdAt: Option[Instant] = None,
    lastUpdatedAt: Option[Instant] = None,
    hidden: Option[Boolean] = None
)

final case class CreateAccount(
    userId: UserId,
    name: AccountName,
    currency: Currency
)
