package expensetracker.accounts.db

import expensetracker.accounts.{Account, AccountId, CreateAccount}
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository

trait AccountRepository[F[_]] extends Repository[F]:
  def create(acc: CreateAccount): F[Account]
  def update(acc: Account): F[Unit]
  def getAll(uid: UserId): F[List[Account]]
  def delete(uid: UserId, aid: AccountId): F[Unit]
  def save(accs: List[Account]): F[Unit]
