package expensetracker.common.actions

import expensetracker.account.{Account, AccountId}
import expensetracker.auth.user.{User, UserId}
import expensetracker.category.{Category, CategoryId}
import expensetracker.transaction.{PeriodicTransaction, RecurrenceCheckpoint, Transaction}
import squants.market.Currency

enum Action:
  case DeleteAllUserData(uid: UserId)
  case DeleteAllAccounts(uid: UserId)
  case DeleteAllCategories(uid: UserId)
  case DeleteAllTransactions(uid: UserId)
  case DeleteAllPeriodicTransactions(uid: UserId)
  case SaveCategories(categories: List[Category])
  case SaveTransactions(transactions: List[Transaction])
  case SaveGeneratedRecurrences(transactions: List[Transaction], checkpoints: List[RecurrenceCheckpoint])
  case SavePeriodicTransactions(periodicTransactions: List[PeriodicTransaction])
  case SaveUsers(users: List[User])
  case SaveAccounts(accounts: List[Account])
  case SetupNewUser(uid: UserId, currency: Currency)
  case HideTransactionsByCategory(cid: CategoryId, hidden: Boolean)
  case HideTransactionsByAccount(aid: AccountId, hidden: Boolean)
  case GeneratePeriodicTransactionRecurrences
  case SchedulePeriodicTransactionRecurrenceGeneration
