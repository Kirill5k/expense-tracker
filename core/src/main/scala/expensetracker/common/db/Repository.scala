package expensetracker.common.db

import cats.MonadError
import cats.implicits._
import com.mongodb.client.result.UpdateResult
import expensetracker.auth.user.UserId
import mongo4cats.bson.ObjectId
import mongo4cats.collection.operations.{Filter, Update}

import java.time.Instant

trait Repository[F[_]] {

  protected object Field {
    val Name          = "name"
    val UId           = "userId"
    val Id            = "_id"
    val Email         = "email"
    val Hidden        = "hidden"
    val LastUpdatedAt = "lastUpdatedAt"
    val Status        = "status"
  }

  protected val notHidden: Filter = Filter.ne(Field.Hidden, true)

  private def idEqFilter(name: String, id: String): Filter = Filter.eq(name, ObjectId(id))
  protected def idEq(id: String): Filter                   = idEqFilter(Field.Id, id)
  protected def userIdEq(aid: Option[UserId]): Filter      = idEqFilter(Field.UId, aid.map(_.value).orNull)
  protected def userIdEq(aid: UserId): Filter              = idEqFilter(Field.UId, aid.value)

  protected def errorIfNull[A](error: Throwable)(res: A)(implicit F: MonadError[F, Throwable]): F[A] =
    Option(res).map(_.pure[F]).getOrElse(error.raiseError[F, A])

  protected def errorIfNoMatches(error: Throwable)(res: UpdateResult)(implicit F: MonadError[F, Throwable]): F[Unit] =
    if (res.getMatchedCount > 0) F.unit else error.raiseError[F, Unit]

  protected def updateHidden(hidden: Boolean): Update =
    Update.set(Field.Hidden, hidden).set(Field.LastUpdatedAt, Instant.now())
}
