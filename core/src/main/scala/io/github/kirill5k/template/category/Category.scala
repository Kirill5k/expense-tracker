package io.github.kirill5k.template.category

import io.github.kirill5k.template.user.User

import java.util.UUID

final case class CategoryId(value: UUID)     extends AnyVal
final case class CategoryName(value: String) extends AnyVal
final case class CategoryIcon(value: String) extends AnyVal

final case class Category(
    id: CategoryId,
    name: CategoryName,
    icon: CategoryIcon,
    user: Option[User]
)
