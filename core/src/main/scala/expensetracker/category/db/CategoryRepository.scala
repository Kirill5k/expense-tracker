package expensetracker.category.db

import cats.effect.Async
import cats.implicits._
import expensetracker.category.Category
import expensetracker.transaction.db.{LiveTransactionRepository, TransactionEntity, TransactionRepository}
import expensetracker.user.UserId
import io.circe.generic.auto._
import mongo4cats.client.MongoClientF
import mongo4cats.circe._
import mongo4cats.database.MongoCollectionF

trait CategoryRepository[F[_]] {
  def getAll(uid: UserId): F[List[Category]]
}

final private class LiveCategoryRepository[F[_]: Async](
    private val collection: MongoCollectionF[CategoryEntity]
) extends CategoryRepository[F] {
  override def getAll(uid: UserId): F[List[Category]] = ???
}

object CategoryRepository {

  def make[F[_]: Async](client: MongoClientF[F]): F[CategoryRepository[F]] =
    client
      .getDatabase("expense-tracker")
      .flatMap(_.getCollectionWithCirceCodecs[CategoryEntity]("categories"))
      .map(coll => new LiveCategoryRepository[F](coll))
}
