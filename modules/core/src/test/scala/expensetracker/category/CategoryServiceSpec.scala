package expensetracker.category

import cats.effect.IO
import kirill5k.common.cats.test.IOWordSpec
import expensetracker.auth.user.UserId
import expensetracker.category.db.CategoryRepository
import expensetracker.common.actions.Action
import expensetracker.common.actions.Action.HideTransactionsByCategory
import expensetracker.common.actions.ActionDispatcher
import expensetracker.fixtures.{Categories, Users}

class CategoryServiceSpec extends IOWordSpec {

  "A CategoryService" should {
    "delete category from db" in {
      val (repo, disp) = mocks
      when(repo.delete(any[UserId], any[CategoryId])).thenReturnUnit

      val result = for
        svc <- CategoryService.make[IO](repo, disp)
        res <- svc.delete(Users.uid1, Categories.cid)
      yield res

      result.asserting { res =>
        verify(repo).delete(Users.uid1, Categories.cid)
        verifyNoInteractions(disp)
        res mustBe ()
      }
    }

    "retrieve categories from db" in {
      val (repo, disp) = mocks
      when(repo.getAll(any[UserId])).thenReturnIO(List(Categories.cat()))

      val result = for
        svc <- CategoryService.make[IO](repo, disp)
        res <- svc.getAll(Users.uid1)
      yield res

      result.asserting { res =>
        verify(repo).getAll(Users.uid1)
        verifyNoInteractions(disp)
        res mustBe List(Categories.cat())
      }
    }

    "retrieve category from db" in {
      val (repo, disp) = mocks
      when(repo.get(any[UserId], any[CategoryId])).thenReturnIO(Categories.cat())

      val result = for
        svc <- CategoryService.make[IO](repo, disp)
        res <- svc.get(Users.uid1, Categories.cid)
      yield res

      result.asserting { res =>
        verify(repo).get(Users.uid1, Categories.cid)
        verifyNoInteractions(disp)
        res mustBe Categories.cat()
      }
    }

    "create new category in db" in {
      val cat = Categories.cat()
      val (repo, disp) = mocks
      when(repo.create(any[CreateCategory])).thenReturnIO(cat)

      val result = for
        svc <- CategoryService.make[IO](repo, disp)
        res <- svc.create(Categories.create())
      yield res

      result.asserting { res =>
        verify(repo).create(Categories.create())
        verifyNoInteractions(disp)
        res mustBe cat
      }
    }

    "update category in db" in {
      val (repo, disp) = mocks
      when(repo.update(any[Category])).thenReturnUnit

      val result = for
        svc <- CategoryService.make[IO](repo, disp)
        res <- svc.update(Categories.cat())
      yield res

      result.asserting { res =>
        verify(repo).update(Categories.cat())
        verifyNoInteractions(disp)
        res mustBe ()
      }
    }

    "assign default categories to a user" in {
      val (repo, disp) = mocks
      when(repo.assignDefault(any[UserId])).thenReturnUnit

      val result = for
        svc <- CategoryService.make[IO](repo, disp)
        res <- svc.assignDefault(Users.uid1)
      yield res

      result.asserting { res =>
        verify(repo).assignDefault(Users.uid1)
        verifyNoInteractions(disp)
        res mustBe ()
      }
    }

    "hide a category" in {
      val (repo, disp) = mocks
      when(repo.hide(any[UserId], any[CategoryId], anyBoolean)).thenReturnUnit
      when(disp.dispatch(any[Action])).thenReturnUnit

      val result = for
        svc <- CategoryService.make[IO](repo, disp)
        res <- svc.hide(Users.uid1, Categories.cid, true)
      yield res

      result.asserting { res =>
        verify(repo).hide(Users.uid1, Categories.cid, true)
        verify(disp).dispatch(HideTransactionsByCategory(Categories.cid, true))
        res mustBe ()
      }
    }
  }
  
  def mocks: (CategoryRepository[IO], ActionDispatcher[IO]) =
    (mock[CategoryRepository[IO]], mock[ActionDispatcher[IO]])
}
