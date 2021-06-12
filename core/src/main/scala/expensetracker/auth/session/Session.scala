package expensetracker.auth.session

import expensetracker.auth.account.AccountId

import java.time.Instant

final case class SessionId(value: String) extends AnyVal

final case class Session(
    id: SessionId,
    accountId: AccountId,
    createdAt: Instant,
    expiresAt: Instant
) {
  def hasExpired: Boolean = Instant.now().isAfter(expiresAt)
}
