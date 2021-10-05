package expensetracker.category.db

import cats.effect.Async
import cats.implicits._
import expensetracker.category.{Category, CategoryId, CreateCategory}
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError.{CategoryAlreadyExists, CategoryDoesNotExist}
import io.circe.generic.auto._
import expensetracker.common.json._
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.collection.operations.Filter
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase

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
    private val collection: MongoCollection[F, CategoryEntity]
) extends CategoryRepository[F] {

  override def getAll(aid: UserId): F[List[Category]] =
    collection
      .find(userIdEq(aid).and(notHidden))
      .sortBy(Field.Name)
      .all
      .map(_.toList.map(_.toDomain))

  override def get(aid: UserId, cid: CategoryId): F[Category] =
    collection
      .find(userIdEq(aid).and(idEq(cid.value)))
      .first
      .flatMap {
        case Some(cat) => cat.toDomain.pure[F]
        case None      => CategoryDoesNotExist(cid).raiseError[F, Category]
      }

  override def delete(aid: UserId, cid: CategoryId): F[Unit] =
    collection
      .findOneAndDelete(userIdEq(aid).and(idEq(cid.value)))
      .flatMap {
        case Some(_) => ().pure[F]
        case None    => CategoryDoesNotExist(cid).raiseError[F, Unit]
      }

  override def create(cat: CreateCategory): F[CategoryId] = {
    val newCat = CategoryEntity.from(cat)
    collection
      .count(userIdEq(cat.userId).and(notHidden).and(Filter.regex(Field.Name, "(?i)^" + newCat.name + "$")))
      .flatMap {
        case 0 => collection.insertOne(newCat).as(CategoryId(newCat._id.toHexString))
        case _ => CategoryAlreadyExists(cat.name).raiseError[F, CategoryId]
      }
  }

  override def update(cat: Category): F[Unit] =
    collection
      .findOneAndReplace(userIdEq(cat.userId).and(idEq(cat.id.value)), CategoryEntity.from(cat))
      .flatMap {
        case Some(_) => ().pure[F]
        case None    => CategoryDoesNotExist(cat.id).raiseError[F, Unit]
      }

  override def assignDefault(aid: UserId): F[Unit] =
    collection
      .find(Filter.notExists(Field.UId).or(Filter.isNull(Field.UId)))
      .all
      .map(_.map(_.copy(_id = ObjectId(), userId = Some(ObjectId(aid.value)))).toList)
      .flatMap(collection.insertMany)
      .void

  override def hide(aid: UserId, cid: CategoryId, hidden: Boolean = true): F[Unit] =
    collection
      .updateOne(userIdEq(aid).and(idEq(cid.value)), updateHidden(hidden))
      .flatMap(errorIfNoMatches(CategoryDoesNotExist(cid)))

  override def isHidden(aid: UserId, cid: CategoryId): F[Boolean] =
    collection
      .count(userIdEq(aid).and(idEq(cid.value)).and(Filter.eq(Field.Hidden, true)))
      .map(_ > 0)
}

object CategoryRepository {

  def make[F[_]: Async](db: MongoDatabase[F]): F[CategoryRepository[F]] =
    db
      .getCollectionWithCodec[CategoryEntity]("categories")
      .map(coll => new LiveCategoryRepository[F](coll))
}
