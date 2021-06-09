package io.github.kirill5k.template.category

import io.github.kirill5k.template.user.UserId

final case class CategoryId(value: String)     extends AnyVal
final case class CategoryName(value: String) extends AnyVal
final case class CategoryIcon(value: String) extends AnyVal

final case class Category(
    id: CategoryId,
    name: CategoryName,
    icon: CategoryIcon,
    userId: Option[UserId]
)
