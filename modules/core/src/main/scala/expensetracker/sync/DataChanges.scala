package expensetracker.sync

import expensetracker.auth.user.User
import expensetracker.category.Category
import expensetracker.transaction.{PeriodicTransaction, Transaction}
import io.circe.Codec
import io.circe.generic.semiauto.deriveCodec

import java.time.Instant

final case class DataChange[A](
    created: List[A],
    updated: List[A]
)

object DataChange:
  given [A](using ca: Codec[A]): Codec[DataChange[A]] = deriveCodec[DataChange[A]]

final case class DataChanges(
    periodicTransactions: DataChange[PeriodicTransaction],
    transactions: DataChange[Transaction],
    categories: DataChange[Category],
    users: DataChange[User],
    time: Instant
)
