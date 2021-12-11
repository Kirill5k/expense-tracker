package expensetracker.common.actions

import expensetracker.auth.user.UserId

enum Action:
  case SetupNewUser(id: UserId)
