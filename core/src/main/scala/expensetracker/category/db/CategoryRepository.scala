package expensetracker.category.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.Filters
import expensetracker.category.{Category, CategoryId}
import expensetracker.auth.account.AccountId
import io.circe.generic.auto._
import mongo4cats.circe._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}
import org.bson.conversions.Bson
import org.bson.types.ObjectId

trait CategoryRepository[F[_]] {
  def getAll(aid: AccountId): F[List[Category]]
  def delete(aid: AccountId, cid: CategoryId): F[Unit]
}

final private class LiveCategoryRepository[F[_]: Async](
    private val collection: MongoCollectionF[CategoryEntity]
) extends CategoryRepository[F] {

  override def getAll(aid: AccountId): F[List[Category]] =
    collection
      .find(idEq("accountId", aid.value))
      .all[F]
      .map(_.toList.map(_.toDomain))

  override def delete(aid: AccountId, cid: CategoryId): F[Unit] =
    collection
      .deleteOne(Filters.and(idEq("accountId", aid.value), idEq("id", cid.value)))
      .void

  private def idEq(name: String, id: String): Bson =
    Filters.eq(name, new ObjectId(id))
}

object CategoryRepository {

  def make[F[_]: Async](db: MongoDatabaseF[F]): F[CategoryRepository[F]] =
    db
      .getCollectionWithCirceCodecs[CategoryEntity]("categories")
      .map(coll => new LiveCategoryRepository[F](coll))
}
