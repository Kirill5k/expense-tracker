package expensetracker.category.db

import cats.effect.Async
import cats.implicits._
import com.mongodb.client.model.{Filters, Updates}
import expensetracker.category.{Category, CategoryId, CreateCategory}
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError.{CategoryAlreadyExists, CategoryDoesNotExist}
import io.circe.generic.auto._
import expensetracker.common.json._
import mongo4cats.circe._
import mongo4cats.database.{MongoCollectionF, MongoDatabaseF}
import org.bson.types.ObjectId

trait CategoryRepository[F[_]] extends Repository[F] {
  def create(cat: CreateCategory): F[CategoryId]
  def update(cat: Category): F[Unit]
  def get(aid: UserId, cid: CategoryId): F[Category]
  def getAll(aid: UserId): F[List[Category]]
  def delete(aid: UserId, cid: CategoryId): F[Unit]
  def assignDefault(aid: UserId): F[Unit]
  def hide(aid: UserId, cid: CategoryId, hidden: Boolean = true): F[Unit]
  def isHidden(aid: UserId, cid: CategoryId): F[Boolean]
}

final private class LiveCategoryRepository[F[_]: Async](
    private val collection: MongoCollectionF[CategoryEntity]
) extends CategoryRepository[F] {

  override def getAll(aid: UserId): F[List[Category]] =
    collection
      .find(Filters.and(accIdEq(aid), notHidden))
      .all[F]
      .map(_.toList.map(_.toDomain))

  override def get(aid: UserId, cid: CategoryId): F[Category] =
    collection
      .find(Filters.and(accIdEq(aid), idEq(cid.value)))
      .first[F]
      .flatMap(errorIfNull(CategoryDoesNotExist(cid)))
      .map(_.toDomain)

  override def delete(aid: UserId, cid: CategoryId): F[Unit] =
    collection
      .findOneAndDelete[F](Filters.and(accIdEq(aid), idEq(cid.value)))
      .flatMap(errorIfNull(CategoryDoesNotExist(cid)))
      .void

  override def create(cat: CreateCategory): F[CategoryId] = {
    val newCat = CategoryEntity.from(cat)
    collection
      .count(Filters.and(accIdEq(cat.accountId), Filters.regex("name", "(?i)^" + newCat.name  + "$"), notHidden))
      .flatMap {
        case 0 => collection.insertOne[F](newCat).as(CategoryId(newCat._id.toHexString))
        case _ => CategoryAlreadyExists(cat.name).raiseError[F, CategoryId]
      }
  }

  override def update(cat: Category): F[Unit] =
    collection
      .findOneAndReplace[F](
        Filters.and(accIdEq(cat.userId), idEq(cat.id.value)),
        CategoryEntity.from(cat)
      )
      .flatMap(r => errorIfNull(CategoryDoesNotExist(cat.id))(r).void)

  override def assignDefault(aid: UserId): F[Unit] =
    collection
      .find(Filters.or(Filters.exists(AccIdField, false), isNull(AccIdField)))
      .all[F]
      .map(_.map(_.copy(_id = new ObjectId(), accountId = Some(new ObjectId(aid.value)))).toList)
      .flatMap { cats =>
        collection.insertMany(cats)
      }
      .void

  override def hide(aid: UserId, cid: CategoryId, hidden: Boolean = true): F[Unit] =
    collection
      .updateOne(
        Filters.and(accIdEq(aid), idEq(cid.value)),
        Updates.set(HiddenField, hidden)
      )
      .flatMap(errorIfNoMatches(CategoryDoesNotExist(cid)))

  override def isHidden(aid: UserId, cid: CategoryId): F[Boolean] =
    collection
      .count(Filters.and(accIdEq(aid), idEq(cid.value), Filters.eq(HiddenField, true)))
      .map(_ > 0)
}

object CategoryRepository {

  def make[F[_]: Async](db: MongoDatabaseF[F]): F[CategoryRepository[F]] =
    db
      .getCollectionWithCirceCodecs[CategoryEntity]("categories")
      .map(coll => new LiveCategoryRepository[F](coll))
}
