package expensetracker.common.db

import cats.MonadError
import cats.implicits._
import com.mongodb.client.model.Filters
import org.bson.conversions.Bson
import org.bson.types.ObjectId

trait Repository[F[_]] {

  protected val AccountId = "accountId"
  protected val Id = "_id"

  protected def errorIfNull[A](error: Throwable)(res: A)(implicit F: MonadError[F, Throwable]): F[A] =
    Option(res).map(_.pure[F]).getOrElse(error.raiseError[F, A])

  protected def idEq(name: String, id: String): Bson =
    Filters.eq(name, new ObjectId(id))
}
