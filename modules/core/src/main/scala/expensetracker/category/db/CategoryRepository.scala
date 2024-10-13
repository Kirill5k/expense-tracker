package expensetracker.category.db

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.category.{Category, CategoryId, CategoryKind, CreateCategory}
import expensetracker.auth.user.UserId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError
import kirill5k.common.cats.syntax.applicative.*
import kirill5k.common.cats.syntax.monadthrow.*
import mongo4cats.bson.ObjectId
import mongo4cats.circe.MongoJsonCodecs
import mongo4cats.operations.{Filter, Update}
import mongo4cats.collection.MongoCollection
import mongo4cats.database.MongoDatabase

trait CategoryRepository[F[_]] extends Repository[F]:
  def create(cat: CreateCategory): F[Category]
  def update(cat: Category): F[Unit]
  def get(uid: UserId, cid: CategoryId): F[Category]
  def getAll(uid: UserId): F[List[Category]]
  def delete(uid: UserId, cid: CategoryId): F[Unit]
  def assignDefault(uid: UserId): F[Unit]
  def hide(uid: UserId, cid: CategoryId, hidden: Boolean = true): F[Unit]
  def isHidden(uid: UserId, cid: CategoryId): F[Boolean]

final private class LiveCategoryRepository[F[_]](
    private val collection: MongoCollection[F, CategoryEntity]
)(using
    F: Async[F]
) extends CategoryRepository[F] {

  override def getAll(uid: UserId): F[List[Category]] =
    collection
      .find(userIdEq(uid) && notHidden)
      .sortBy(Field.Name)
      .all
      .mapList(_.toDomain)

  override def get(uid: UserId, cid: CategoryId): F[Category] =
    collection
      .find(userIdEq(uid) && idEq(cid.toObjectId))
      .first
      .unwrapOpt(AppError.CategoryDoesNotExist(cid))
      .map(_.toDomain)

  override def delete(uid: UserId, cid: CategoryId): F[Unit] =
    collection
      .deleteOne(userIdEq(uid) && idEq(cid.toObjectId))
      .flatMap { result =>
        F.raiseWhen(result.getDeletedCount == 0)(AppError.CategoryDoesNotExist(cid))
      }

  override def create(cat: CreateCategory): F[Category] = {
    val newCat = CategoryEntity.from(cat)
    collection
      .count(userIdEq(cat.userId) && notHidden && Filter.regex(Field.Name, "(?i)^" + newCat.name + "$"))
      .flatMap {
        case 0 => collection.insertOne(newCat).as(newCat.toDomain)
        case _ => F.raiseError(AppError.CategoryAlreadyExists(cat.name))
      }
  }

  override def update(cat: Category): F[Unit] =
    collection
      .updateOne(
        userIdEq(cat.userId) && idEq(cat.id.toObjectId),
        Update
          .set(Field.Kind, cat.kind)
          .set(Field.Name, cat.name)
          .set(Field.Icon, cat.icon)
          .set(Field.Color, cat.color)
          .currentDate(Field.LastUpdatedAt)
      )
      .flatMap(errorIfNoMatches(AppError.CategoryDoesNotExist(cat.id)))

  override def assignDefault(uid: UserId): F[Unit] =
    collection
      .find(Filter.notExists(Field.UId) || Filter.isNull(Field.UId))
      .all
      .mapList(_.copy(_id = ObjectId.gen, userId = Some(uid.toObjectId)))
      .flatMap(collection.insertMany)
      .void

  override def hide(uid: UserId, cid: CategoryId, hidden: Boolean = true): F[Unit] =
    collection
      .updateOne(userIdEq(uid) && idEq(cid.toObjectId), updateHidden(hidden))
      .flatMap(errorIfNoMatches(AppError.CategoryDoesNotExist(cid)))

  override def isHidden(uid: UserId, cid: CategoryId): F[Boolean] =
    collection
      .count(userIdEq(uid) && idEq(cid.toObjectId) && isHidden)
      .map(_ > 0)
}

object CategoryRepository extends MongoJsonCodecs:
  def make[F[_]: Async](db: MongoDatabase[F]): F[CategoryRepository[F]] =
    db.getCollectionWithCodec[CategoryEntity]("categories")
      .map(_.withAddedCodec[CategoryKind])
      .map(LiveCategoryRepository[F](_))
