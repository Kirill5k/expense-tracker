package expensetracker.common

object errors {

  sealed trait AppError extends Throwable {
    def message: String
    override def getMessage: String = message
  }
}
