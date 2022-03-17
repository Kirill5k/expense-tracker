package expensetracker.category

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.auth.user.UserId
import expensetracker.category.db.CategoryRepository
import expensetracker.fixtures.{Users, Categories}
import org.mockito.ArgumentMatchers.{any, anyBoolean}
import org.mockito.Mockito.{verify, when}

class CategoryServiceSpec extends CatsSpec {

  "A CategoryService" should {
    "delete category from db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.delete(any[UserId], any[CategoryId])).thenReturn(IO.unit)

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.delete(Users.uid1, Categories.cid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).delete(Users.uid1, Categories.cid)
        res mustBe ()
      }
    }

    "retrieve categories from db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.getAll(any[UserId])).thenReturn(IO.pure(List(Categories.cat())))

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.getAll(Users.uid1)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).getAll(Users.uid1)
        res mustBe List(Categories.cat())
      }
    }

    "retrieve category from db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.get(any[UserId], any[CategoryId])).thenReturn(IO.pure(Categories.cat()))

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.get(Users.uid1, Categories.cid)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).get(Users.uid1, Categories.cid)
        res mustBe Categories.cat()
      }
    }

    "create new category in db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.create(any[CreateCategory])).thenReturn(IO.pure(Categories.cid))

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.create(Categories.create())
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).create(Categories.create())
        res mustBe Categories.cid
      }
    }

    "update category in db" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.update(any[Category])).thenReturn(IO.unit)

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.update(Categories.cat())
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).update(Categories.cat())
        res mustBe ()
      }
    }

    "assign default categories to a user" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.assignDefault(any[UserId])).thenReturn(IO.unit)

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.assignDefault(Users.uid1)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).assignDefault(Users.uid1)
        res mustBe ()
      }
    }

    "hide a category" in {
      val repo = mock[CategoryRepository[IO]]
      when(repo.hide(any[UserId], any[CategoryId], anyBoolean)).thenReturn(IO.unit)

      val result = for {
        svc <- CategoryService.make[IO](repo)
        res <- svc.hide(Users.uid1, Categories.cid, true)
      } yield res

      result.unsafeToFuture().map { res =>
        verify(repo).hide(Users.uid1, Categories.cid, true)
        res mustBe ()
      }
    }
  }
}
