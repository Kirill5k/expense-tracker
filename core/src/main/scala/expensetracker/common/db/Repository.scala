package expensetracker.common.db

import cats.MonadError
import cats.implicits._
import com.mongodb.client.model.Filters
import com.mongodb.client.result.UpdateResult
import expensetracker.auth.account.AccountId
import org.bson.conversions.Bson
import org.bson.types.ObjectId

trait Repository[F[_]] {

  protected val AccIdField  = "accountId"
  protected val IdField     = "_id"
  protected val EmailField  = "email"
  protected val HiddenField = "hidden"

  protected val notHidden: Bson = Filters.ne(HiddenField, true)

  private def idEqFilter(name: String, id: String): Bson = Filters.eq(name, new ObjectId(id))
  protected def idEq(id: String): Bson                   = idEqFilter(IdField, id)
  protected def accIdEq(aid: Option[AccountId]): Bson    = idEqFilter(AccIdField, aid.map(_.value).orNull)
  protected def accIdEq(aid: AccountId): Bson            = idEqFilter(AccIdField, aid.value)
  protected def isNull(name: String): Bson               = Filters.eq(name, null)

  protected def errorIfNull[A](error: Throwable)(res: A)(implicit F: MonadError[F, Throwable]): F[A] =
    Option(res).map(_.pure[F]).getOrElse(error.raiseError[F, A])

  protected def errorIfNoMatches(error: Throwable)(res: UpdateResult)(implicit F: MonadError[F, Throwable]): F[Unit] =
    if (res.getMatchedCount > 0) F.unit else error.raiseError[F, Unit]
}
