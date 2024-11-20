package expensetracker.common.actions

import expensetracker.auth.user.{User, UserId}
import expensetracker.category.{Category, CategoryId}
import expensetracker.transaction.{PeriodicTransaction, Transaction}

enum Action:
  case SaveCategories(categories: List[Category])
  case SaveTransactions(transactions: List[Transaction])
  case SaveUsers(users: List[User])
  case SetupNewUser(uid: UserId)
  case HideTransactionsByCategory(cid: CategoryId, hidden: Boolean)
  case GenerateInstances(tx: PeriodicTransaction)
