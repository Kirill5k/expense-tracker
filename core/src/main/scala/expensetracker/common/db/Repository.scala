package expensetracker.common.db

import cats.MonadError
import cats.syntax.applicative.*
import cats.syntax.applicativeError.*
import com.mongodb.client.result.UpdateResult
import expensetracker.auth.user.UserId
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

  private def idEqFilter(name: String, id: String): Filter = Filter.eq(name, ObjectId(id))
  protected def idEq(id: String): Filter                   = idEqFilter(Field.Id, id)
  protected def userIdEq(aid: Option[UserId]): Filter      = idEqFilter(Field.UId, aid.map(_.value).orNull)
  protected def userIdEq(aid: UserId): Filter              = idEqFilter(Field.UId, aid.value)

  protected def errorIfNull[A](error: Throwable)(res: A)(using F: MonadError[F, Throwable]): F[A] =
    F.fromOption(Option(res), error)

  protected def errorIfNoMatches(error: Throwable)(res: UpdateResult)(using F: MonadError[F, Throwable]): F[Unit] =
    if (res.getMatchedCount > 0) F.unit else error.raiseError[F, Unit]

  protected def updateHidden(hidden: Boolean): Update =
    Update.set(Field.Hidden, hidden).currentDate(Field.LastUpdatedAt)
}
