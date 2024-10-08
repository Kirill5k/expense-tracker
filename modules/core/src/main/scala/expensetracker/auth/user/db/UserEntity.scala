package expensetracker.auth.user.db

import io.circe.Codec
import expensetracker.auth.user.*
import expensetracker.category.db.CategoryEntity
import mongo4cats.bson.ObjectId
import mongo4cats.circe.given

import java.time.Instant

final case class UserEntity(
    _id: ObjectId,
    email: String,
    name: UserName,
    password: String,
    settings: Option[UserSettings],
    registrationDate: Instant,
    categories: Option[List[CategoryEntity]] = None,
    totalTransactionCount: Option[Int] = None
) derives Codec.AsObject {
  def toDomain: User =
    User(
      id = UserId(_id),
      email = UserEmail(email),
      name = name,
      password = PasswordHash(password),
      settings = settings.getOrElse(UserSettings.Default),
      registrationDate = registrationDate,
      categories = categories.map(_.map(_.toDomain)),
      totalTransactionCount = totalTransactionCount
    )
}

object UserEntity {
  def create(details: UserDetails, password: PasswordHash): UserEntity =
    UserEntity(
      ObjectId(),
      details.email.value,
      details.name,
      password.value,
      Some(UserSettings(
        currency = details.currency.getOrElse(UserSettings.Default.currency),
        hideFutureTransactions = false,
        darkMode = None,
        futureTransactionVisibilityDays = None
      )),
      Instant.now()
    )
}
