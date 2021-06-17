package expensetracker.category.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.Filters
import expensetracker.category.{Category, CategoryId, CreateCategory}
import expensetracker.auth.account.AccountId
import expensetracker.common.errors.AppError.CategoryDoesNotExist
import io.circe.generic.auto._
import mongo4cats.circe._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}
import org.bson.conversions.Bson
import org.bson.types.ObjectId

trait CategoryRepository[F[_]] {
  def create(cat: CreateCategory): F[CategoryId]
  def update(cat: Category): F[Unit]
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
      .deleteOne(Filters.and(idEq("accountId", aid.value), idEq("_id", cid.value)))
      .void

  override def create(cat: CreateCategory): F[CategoryId] = ???

  override def update(cat: Category): F[Unit] = {
    collection
      .findOneAndReplace[F](
        Filters.and(idEq("accountId", cat.accountId.map(_.value).orNull), idEq("_id", cat.id.value)),
        CategoryEntity.from(cat)
      )
      .flatMap { res =>
        Option(res).as(().pure[F]).getOrElse(CategoryDoesNotExist(cat.id).raiseError[F, Unit])
      }
  }

  private def idEq(name: String, id: String): Bson =
    Filters.eq(name, new ObjectId(id))
}

object CategoryRepository {

  def make[F[_]: Async](db: MongoDatabaseF[F]): F[CategoryRepository[F]] =
    db
      .getCollectionWithCirceCodecs[CategoryEntity]("categories")
      .map(coll => new LiveCategoryRepository[F](coll))
}
