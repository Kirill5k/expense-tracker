package expensetracker.common.db

import cats.MonadError
import cats.syntax.option.*
import com.mongodb.client.result.UpdateResult
import expensetracker.auth.user.UserId
import mongo4cats.bson.ObjectId
import mongo4cats.operations.{Aggregate, Filter, Sort, Update}

trait Repository[F[_]] {

  protected object Field {
    val Id             = "_id"
    val Name           = "name"
    val Color          = "color"
    val Amount         = "amount"
    val Icon           = "icon"
    val Kind           = "kind"
    val Settings       = "settings"
    val Password       = "password"
    val UId            = "userId"
    val CId            = "categoryId"
    val Email          = "email"
    val Note           = "note"
    val Hidden         = "hidden"
    val CreatedAt      = "createdAt"
    val LastUpdatedAt  = "lastUpdatedAt"
    val Status         = "status"
    val LastAccessedAt = "lastAccessedAt"
    val Date           = "date"
    val Recurrence     = "recurrence"
    val Tags           = "tags"
    val Category       = "category"
    val Categories     = "categories"
    val Transactions   = "transactions"
  }

  protected val notHidden: Filter = Filter.ne(Field.Hidden, true)
  protected val isHidden: Filter  = Filter.eq(Field.Hidden, true)

  protected val findTxWithCategory = (filter: Filter) =>
    Aggregate
      .matchBy(filter)
      .sort(Sort.desc(Field.Date))
      .lookup("categories", Field.CId, Field.Id, Field.Category)
      .unwind("$" + Field.Category)

  private def idEqFilter(name: String, id: Option[ObjectId]): Filter = Filter.eq(name, id)
  protected def idEq(id: ObjectId): Filter                           = idEqFilter(Field.Id, id.some)
  protected def userIdEq(aid: Option[UserId]): Filter                = idEqFilter(Field.UId, aid.map(_.toObjectId))
  protected def userIdEq(aid: UserId): Filter                        = idEqFilter(Field.UId, aid.toObjectId.some)

  protected def errorIfNoMatches(error: Throwable)(res: UpdateResult)(using F: MonadError[F, Throwable]): F[Unit] =
    F.raiseWhen(res.getMatchedCount == 0)(error)

  protected def updateHidden(hidden: Boolean): Update =
    Update.set(Field.Hidden, hidden).currentDate(Field.LastUpdatedAt)
}
