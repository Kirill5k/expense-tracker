package expensetracker.category.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.Filters
import expensetracker.category.{Category, CategoryId, CreateCategory}
import expensetracker.auth.account.AccountId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError.CategoryDoesNotExist
import io.circe.generic.auto._
import expensetracker.common.json._
import mongo4cats.circe._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}
import org.bson.types.ObjectId

trait CategoryRepository[F[_]] extends Repository[F] {
  def create(cat: CreateCategory): F[CategoryId]
  def update(cat: Category): F[Unit]
  def get(aid: AccountId, cid: CategoryId): F[Category]
  def getAll(aid: AccountId): F[List[Category]]
  def delete(aid: AccountId, cid: CategoryId): F[Unit]
  def assignDefault(aid: AccountId): F[Unit]
}

final private class LiveCategoryRepository[F[_]: Async](
    private val collection: MongoCollectionF[CategoryEntity]
) extends CategoryRepository[F] {

  override def getAll(aid: AccountId): F[List[Category]] =
    collection
      .find(idEq(AccountId, aid.value))
      .all[F]
      .map(_.toList.map(_.toDomain))

  override def get(aid: AccountId, cid: CategoryId): F[Category] =
    collection
      .find(Filters.and(idEq(AccountId, aid.value), idEq(Id, cid.value)))
      .first[F]
      .flatMap(errorIfNull(CategoryDoesNotExist(cid)))
      .map(_.toDomain)

  override def delete(aid: AccountId, cid: CategoryId): F[Unit] =
    collection
      .findOneAndDelete[F](Filters.and(idEq(AccountId, aid.value), idEq(Id, cid.value)))
      .flatMap(r => errorIfNull(CategoryDoesNotExist(cid))(r).void)

  override def create(cat: CreateCategory): F[CategoryId] = {
    // TODO: return CategoryAlreadyExists if already exists
    val newCat = CategoryEntity.from(cat)
    collection.insertOne[F](newCat).as(CategoryId(newCat._id.toHexString))
  }

  override def update(cat: Category): F[Unit] =
    collection
      .findOneAndReplace[F](
        Filters.and(idEq(AccountId, cat.accountId.map(_.value).orNull), idEq(Id, cat.id.value)),
        CategoryEntity.from(cat)
      )
      .flatMap(r => errorIfNull(CategoryDoesNotExist(cat.id))(r).void)

  override def assignDefault(aid: AccountId): F[Unit] =
    collection
      .find(Filters.or(Filters.exists(AccountId, false), Filters.eq(AccountId, null)))
      .all[F]
      .map(_.map(_.copy(_id = new ObjectId(), accountId = Some(new ObjectId(aid.value)))).toList)
      .flatMap { cats =>
        collection.insertMany(cats)
      }
      .void
}

object CategoryRepository {

  def make[F[_]: Async](db: MongoDatabaseF[F]): F[CategoryRepository[F]] =
    db
      .getCollectionWithCirceCodecs[CategoryEntity]("categories")
      .map(coll => new LiveCategoryRepository[F](coll))
}
