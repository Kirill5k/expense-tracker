package expensetracker.category

import expensetracker.auth.account.AccountId
import io.circe.{Decoder, Encoder}

final case class CategoryId(value: String)   extends AnyVal
final case class CategoryName(value: String) extends AnyVal
final case class CategoryIcon(value: String) extends AnyVal

sealed trait CategoryKind
object CategoryKind {
  case object Expense extends CategoryKind
  case object Income  extends CategoryKind

  implicit val decodeCategoryKind: Decoder[CategoryKind] = Decoder[String].emap {
    case "expense" => Right(Expense)
    case "income"  => Right(Income)
    case other     => Left(s"invalid category kind $other")
  }

  implicit val encodeCategoryKind: Encoder[CategoryKind] = Encoder[String].contramap {
    case Expense => "expense"
    case Income  => "income"
  }
}

final case class Category(
    id: CategoryId,
    kind: CategoryKind,
    name: CategoryName,
    icon: CategoryIcon,
    accountId: Option[AccountId]
)

final case class CreateCategory(
    kind: CategoryKind,
    name: CategoryName,
    icon: CategoryIcon,
    accountId: AccountId
)
