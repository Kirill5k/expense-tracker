package expensetracker.common.actions

import expensetracker.auth.user.UserId

sealed trait Action

object Action {
  final case class SetupNewUser(id: UserId) extends Action
}
