package expensetracker.common.actions

import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId

enum Action:
  case SetupNewUser(uid: UserId)
  case HideTransactionsByCategory(cid: CategoryId, hidden: Boolean)
