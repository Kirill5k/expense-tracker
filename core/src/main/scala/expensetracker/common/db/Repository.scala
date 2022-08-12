package expensetracker.common.db

import cats.MonadError
import cats.syntax.option.*
import com.mongodb.client.result.UpdateResult
import expensetracker.auth.user.UserId
import expensetracker.common.types.IdType
import mongo4cats.bson.ObjectId
import mongo4cats.collection.operations.{Filter, Update}

import java.time.Instant

trait Repository[F[_]] {

  protected object Field {
    val Id             = "_id"
    val Name           = "name"
    val UId            = "userId"
    val Email          = "email"
    val Hidden         = "hidden"
    val LastUpdatedAt  = "lastUpdatedAt"
    val Status         = "status"
    val LastAccessedAt = "lastAccessedAt"
  }

  protected val notHidden: Filter = Filter.ne(Field.Hidden, true)

  private def idEqFilter(name: String, id: Option[String]): Filter = Filter.eq(name, id.map(ObjectId.apply))
  protected def idEq(id: String): Filter                           = idEqFilter(Field.Id, id.some)
  protected def userIdEq(aid: Option[UserId]): Filter              = idEqFilter(Field.UId, aid.map(_.value))
  protected def userIdEq(aid: UserId): Filter                      = idEqFilter(Field.UId, aid.value.some)

  protected def errorIfNoMatches(error: Throwable)(res: UpdateResult)(using F: MonadError[F, Throwable]): F[Unit] =
    F.raiseWhen(res.getMatchedCount == 0)(error)

  protected def updateHidden(hidden: Boolean): Update =
    Update.set(Field.Hidden, hidden).currentDate(Field.LastUpdatedAt)
}
