package expensetracker.category

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.user.UserId
import expensetracker.category.db.CategoryRepository

class CategoryServiceSpec extends CatsSpec {

  "A CategoryService" should {
    "delete category from db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.delete(any[UserId], any[CategoryId])).thenReturn(IO.unit)

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.delete(uid, cid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).delete(uid, cid)
        res mustBe ()
      }
    }

    "retrieve categories from db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.getAll(any[UserId])).thenReturn(IO.pure(List(cat)))

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.getAll(uid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).getAll(uid)
        res mustBe List(cat)
      }
    }

    "retrieve category from db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.get(any[UserId], any[CategoryId])).thenReturn(IO.pure(cat))

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.get(uid, cid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).get(uid, cid)
        res mustBe cat
      }
    }

    "create new category in db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.create(any[CreateCategory])).thenReturn(IO.pure(cid))

      val create = CreateCategory(CategoryKind.Expense, cname, CategoryIcon("icon"), CategoryColor("#6200EE"), uid)
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
      when(repo.assignDefault(any[UserId])).thenReturn(IO.unit)

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.assignDefault(uid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).assignDefault(uid)
        res mustBe ()
      }
    }

    "hide a category" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.hide(any[UserId], any[CategoryId], anyBoolean)).thenReturn(IO.unit)

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.hide(uid, cid, true)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).hide(uid, cid, true)
        res mustBe ()
      }
    }
  }
}
