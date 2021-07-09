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

    "retrieve category from db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.get(any[AccountId], any[CategoryId])).thenReturn(IO.pure(cat))

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.get(aid, cid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).get(aid, cid)
        res mustBe cat
      }
    }

    "create new category in db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.create(any[CreateCategory])).thenReturn(IO.pure(cid))

      val create = CreateCategory(CategoryKind.Expense, cname, CategoryIcon("icon"), CategoryColor("#6200EE"), aid)
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

    "assign default categories to a user" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.assignDefault(any[AccountId])).thenReturn(IO.unit)

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.assignDefault(aid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).assignDefault(aid)
        res mustBe ()
      }
    }

    "hide a category" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.hide(any[AccountId], any[CategoryId], anyBoolean)).thenReturn(IO.unit)

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.hide(aid, cid, true)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).hide(aid, cid, true)
        res mustBe ()
      }
    }
  }
}
