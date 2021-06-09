package expensetracker.user

final case class UserId(value: String)         extends AnyVal
final case class UserName(value: String)     extends AnyVal
final case class PasswordHash(value: String) extends AnyVal

final case class User(
    id: UserId,
    name: UserName,
    password: Option[PasswordHash]
)
