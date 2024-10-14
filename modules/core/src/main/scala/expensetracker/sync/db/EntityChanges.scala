package expensetracker.sync.db

import expensetracker.auth.user.db.UserEntity
import expensetracker.category.db.CategoryEntity
import expensetracker.sync.{DataChange, DataChanges}
import expensetracker.transaction.db.TransactionEntity
import io.circe.Codec
import io.circe.generic.semiauto.deriveCodec
import mongo4cats.circe.MongoJsonCodecs
import mongo4cats.codecs.MongoCodecProvider

import java.time.Instant

final case class EntityChanges(
    transactions: DataChange[TransactionEntity],
    categories: DataChange[CategoryEntity],
    users: DataChange[UserEntity],
    time: Instant
) {
  def toDomain: DataChanges =
    DataChanges(
      transactions = DataChange(
        created = transactions.created.map(_.toDomain),
        updated = transactions.updated.map(_.toDomain)
      ),
      categories = DataChange(
        created = categories.created.map(_.toDomain),
        updated = categories.updated.map(_.toDomain)
      ),
      users = DataChange(
        created = users.created.map(_.toDomain),
        updated = users.updated.map(_.toDomain)
      ),
      time = time
    )
}

object EntityChanges extends MongoJsonCodecs:
  given Codec[EntityChanges]              = deriveCodec[EntityChanges]
  given MongoCodecProvider[EntityChanges] = deriveCirceCodecProvider[EntityChanges]
