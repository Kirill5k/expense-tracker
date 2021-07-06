package expensetracker.common.actions

import expensetracker.auth.account.AccountId

sealed trait Action

object Action {
  final case class SetupNewAccount(id: AccountId) extends Action
}
