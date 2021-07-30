package expensetracker.common.db

import cats.MonadError
import cats.implicits._
import com.mongodb.client.result.UpdateResult
import expensetracker.auth.user.UserId
import mongo4cats.bson.ObjectId
import mongo4cats.database.operations.{Filter, Update}

trait Repository[F[_]] {

  protected val UIdField           = "userId"
  protected val IdField            = "_id"
  protected val EmailField         = "email"
  protected val HiddenField        = "hidden"
  protected val LastUpdatedAtField = "lastUpdatedAt"

  protected val notHidden: Filter = Filter.ne(HiddenField, true)

  private def idEqFilter(name: String, id: String): Filter = Filter.eq(name, ObjectId(id))
  protected def idEq(id: String): Filter                   = idEqFilter(IdField, id)
  protected def userIdEq(aid: Option[UserId]): Filter      = idEqFilter(UIdField, aid.map(_.value).orNull)
  protected def userIdEq(aid: UserId): Filter              = idEqFilter(UIdField, aid.value)
  protected def isNull(name: String): Filter               = Filter.eq(name, null)

  protected def errorIfNull[A](error: Throwable)(res: A)(implicit F: MonadError[F, Throwable]): F[A] =
    Option(res).map(_.pure[F]).getOrElse(error.raiseError[F, A])

  protected def errorIfNoMatches(error: Throwable)(res: UpdateResult)(implicit F: MonadError[F, Throwable]): F[Unit] =
    if (res.getMatchedCount > 0) F.unit else error.raiseError[F, Unit]

  protected def updateHidden(hidden: Boolean): Update =
    Update.set(HiddenField, hidden).currentTimestamp(LastUpdatedAtField)
}
