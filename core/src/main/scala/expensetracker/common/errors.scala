package expensetracker.common

import expensetracker.auth.account.AccountEmail

object errors {

  sealed trait AppError extends Throwable {
    def message: String
    override def getMessage: String = message
  }

  sealed trait BadRequestError extends AppError
  sealed trait AuthError       extends AppError

  object AppError {
    final case class Mongo(message: String) extends AppError

    final case class AccountAlreadyExists(email: AccountEmail) extends BadRequestError {
      override def message: String = s"account with email ${email.value} already exists"
    }

    case object InvalidEmailOrPassword extends AuthError {
      override def message: String = "invalid email or password"
    }
  }
}
