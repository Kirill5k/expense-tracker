package expensetracker.common

import expensetracker.auth.account.{AccountEmail, AccountId}
import expensetracker.category.{CategoryId, CategoryName}
import expensetracker.transaction.TransactionId

object errors {

  sealed trait AppError extends Throwable {
    def message: String

    override def getMessage: String = message
  }

  sealed trait NotFoundError   extends AppError
  sealed trait ConflictError   extends AppError
  sealed trait BadRequestError extends AppError
  sealed trait AuthError       extends AppError

  object AppError {
    final case class Mongo(message: String) extends AppError

    final case class AccountAlreadyExists(email: AccountEmail) extends ConflictError {
      override def message: String = s"An account with email ${email.value} already exists"
    }

    final case class AccountDoesNotExist(id: AccountId) extends NotFoundError {
      override def message: String = s"Account with id ${id.value} does not exist"
    }

    case object InvalidEmailOrPassword extends AuthError {
      override def message: String = "Invalid email or password"
    }

    case object InvalidPassword extends BadRequestError {
      override def message: String = "Entered password appears to be incorrect"
    }

    case object DifferentAccountSession extends AuthError {
      override def message: String = "The current session belongs to a different account"
    }

    case object IdMismatch extends BadRequestError {
      override def message: String = "The id supplied in the path does not match with the id in the request body"
    }

    final case class CategoryDoesNotExist(id: CategoryId) extends NotFoundError {
      override def message: String = s"Category with id ${id.value} does not exist"
    }

    final case class CategoryAlreadyExists(name: CategoryName) extends ConflictError {
      override def message: String = s"A category with name ${name.value} already exists"
    }

    final case class TransactionDoesNotExist(id: TransactionId) extends NotFoundError {
      override def message: String = s"Transaction with id ${id.value} does not exist"
    }
  }
}
