package expensetracker.transaction.db

import cats.effect.Async
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import expensetracker.account.AccountId
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import expensetracker.common.db.Repository
import expensetracker.common.errors.AppError
import mongo4cats.database.MongoDatabase
import mongo4cats.operations.Filter

private[db] final class TransactionReferences[F[_]](database: MongoDatabase[F])(using F: Async[F]) extends Repository[F] {
  def validate(uid: UserId, cid: CategoryId, aid: Option[AccountId]): F[Unit] =
    for
      categories <- database.getCollection("categories")
      categoryCount <- categories.count(
        idEq(cid.toObjectId) && notHidden && (userIdEq(uid) || Filter.isNull(Field.UId))
      )
      _ <- F.raiseWhen(categoryCount == 0)(AppError.CategoryDoesNotExist(cid))
      _ <- aid.fold(F.unit) { accountId =>
        for
          accounts <- database.getCollection("accounts")
          accountCount <- accounts.count(idEq(accountId.toObjectId) && userIdEq(uid) && notHidden)
          _ <- F.raiseWhen(accountCount == 0)(AppError.AccountDoesNotExist(accountId))
        yield ()
      }
    yield ()
}
