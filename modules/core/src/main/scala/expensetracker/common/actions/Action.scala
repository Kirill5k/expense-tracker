package expensetracker.common.actions

import expensetracker.auth.user.{User, UserId}
import expensetracker.category.{Category, CategoryId}
import expensetracker.transaction.{PeriodicTransaction, Transaction}

enum Action:
  case DeleteAllCategories(uid: UserId)
  case DeleteAllTransactions(uid: UserId)
  case DeleteAllPeriodicTransactions(uid: UserId)
  case SaveCategories(categories: List[Category])
  case SaveTransactions(transactions: List[Transaction])
  case SavePeriodicTransactions(periodicTransactions: List[PeriodicTransaction])
  case SaveUsers(users: List[User])
  case SetupNewUser(uid: UserId)
  case HideTransactionsByCategory(cid: CategoryId, hidden: Boolean)
  case GeneratePeriodicTransactionRecurrences
  case SchedulePeriodicTransactionRecurrenceGeneration
