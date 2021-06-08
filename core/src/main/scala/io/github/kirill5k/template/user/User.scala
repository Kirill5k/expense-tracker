package io.github.kirill5k.template.user

import java.util.UUID

final case class UserId(value: UUID)         extends AnyVal
final case class UserName(value: String)     extends AnyVal
final case class PasswordHash(value: String) extends AnyVal

final case class User(
    id: UserId,
    name: UserName,
    password: Option[PasswordHash]
)
