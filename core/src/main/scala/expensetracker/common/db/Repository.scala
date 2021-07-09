package expensetracker.common.db

import cats.MonadError
import cats.implicits._
import com.mongodb.client.model.Filters
import com.mongodb.client.result.UpdateResult
import org.bson.conversions.Bson
import org.bson.types.ObjectId

trait Repository[F[_]] {

  protected val AccIdField = "accountId"
  protected val IdField = "_id"
  protected val EmailField = "email"

  protected def errorIfNull[A](error: Throwable)(res: A)(implicit F: MonadError[F, Throwable]): F[A] =
    Option(res).map(_.pure[F]).getOrElse(error.raiseError[F, A])

  protected def idEq(name: String, id: String): Bson =
    Filters.eq(name, new ObjectId(id))

  protected def errorIfNoMatches(error: Throwable)(res: UpdateResult)(implicit F: MonadError[F, Throwable]): F[Unit] =
    if (res.getMatchedCount > 0) F.unit else error.raiseError[F, Unit]
}
