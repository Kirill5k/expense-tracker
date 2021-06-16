package expensetracker.category

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.account.AccountId
import expensetracker.category.db.CategoryRepository

class CategoryServiceSpec extends CatsSpec {

  "A CategoryService" should {
    "delete category from db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.delete(any[AccountId], any[CategoryId])).thenReturn(IO.unit)

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.delete(aid, cid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).delete(aid, cid)
        res mustBe ()
      }
    }

    "retrieve categories from db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.getAll(any[AccountId])).thenReturn(IO.pure(List(cat)))

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.getAll(aid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).getAll(aid)
        res mustBe List(cat)
      }
    }

    "create new category in db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.create(any[CreateCategory])).thenReturn(IO.pure(cid))

      val create = CreateCategory(cname, CategoryIcon("icon"), aid)
      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.create(create)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).create(create)
        res mustBe cid
      }
    }

    "update category in db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.update(any[Category])).thenReturn(IO.unit)

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.update(cat)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).update(cat)
        res mustBe ()
      }
    }
  }
}
