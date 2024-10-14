package expensetracker.sync.db

import expensetracker.auth.user.UserId
import mongo4cats.bson.ObjectId

import java.time.Instant
import io.circe.Codec
import io.circe.generic.semiauto.deriveCodec
import mongo4cats.circe.MongoJsonCodecs
import mongo4cats.codecs.MongoCodecProvider

final case class SyncEntity(
    _id: ObjectId,
    lastPulledAt: Option[Instant]
)

object SyncEntity extends MongoJsonCodecs:
  given Codec[SyncEntity]              = deriveCodec[SyncEntity]
  given MongoCodecProvider[SyncEntity] = deriveCirceCodecProvider[SyncEntity]

  def from(uid: UserId): SyncEntity =
    SyncEntity(
      _id = uid.toObjectId,
      lastPulledAt = None
    )
