package expensetracker.common

import expensetracker.auth.account.AccountEmail
import expensetracker.category.{CategoryId, CategoryName}

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
      override def message: String = s"account with email ${email.value} already exists"
    }

    case object InvalidEmailOrPassword extends AuthError {
      override def message: String = "invalid email or password"
    }

    case object IdMismatch extends BadRequestError {
      override def message: String = "the id supplied in the path does not match with the id in the request body"
    }

    final case class CategoryDoesNotExist(id: CategoryId) extends NotFoundError {
      override def message: String = s"category with id ${id.value} does not exist"
    }

    final case class CategoryAlreadyExists(name: CategoryName) extends ConflictError {
      override def message: String = s"category with name ${name.value} already exists"
    }
  }
}
