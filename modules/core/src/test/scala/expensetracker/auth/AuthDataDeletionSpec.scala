package expensetracker.auth

import cats.effect.{Deferred, IO, Ref}
import expensetracker.account.AccountService
import expensetracker.auth.session.SessionService
import expensetracker.auth.user.{Password, PasswordEncryptor, PasswordHash, UserDetails, UserId, UserService}
import expensetracker.auth.user.db.UserRepository
import expensetracker.category.CategoryService
import expensetracker.common.actions.{Action, ActionDispatcher, ActionProcessor}
import expensetracker.common.errors.AppError
import expensetracker.fixtures.{Sessions, Users}
import expensetracker.transaction.{PeriodicTransactionService, TransactionService}
import kirill5k.common.cats.Clock
import kirill5k.common.cats.test.IOWordSpec
import org.http4s.{Header, Method, Request, Status}
import org.http4s.implicits.*
import org.typelevel.ci.CIString
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger
import squants.market.Currency

import java.time.Instant

class AuthDataDeletionSpec extends IOWordSpec {
  given Clock[IO] = Clock.mock(Instant.parse("2026-09-15T12:00:00Z"))
  given Logger[IO] = Slf4jLogger.getLogger[IO]
  given Authenticator[IO] = _ => IO.pure(Sessions.sess)

  private val request = Request[IO](Method.DELETE, uri"/auth/user/data")
    .putHeaders(Header.Raw(CIString("Authorization"), "Bearer test-token"))

  private val signup = Request[IO](Method.POST, uri"/auth/user")
    .withEntity("""{"email":"new@example.com","password":"test-password","firstName":"New","lastName":"User","currency":{"code":"GBP","symbol":"£"}}""")
    .putHeaders(Header.Raw(CIString("Content-Type"), "application/json"))

  "POST /auth/user" should {
    "allow the same registration to succeed after partial setup failed and was rolled back" in {
      val repo = mock[UserRepository[IO]]
      val encryptor = mock[PasswordEncryptor[IO]]
      val sessions = mock[SessionService[IO]]
      val categories = mock[CategoryService[IO]]
      val transactions = mock[TransactionService[IO]]
      val recurring = mock[PeriodicTransactionService[IO]]
      val accounts = mock[AccountService[IO]]
      when(encryptor.hash(any[Password])).thenReturnIO(Users.hash)
      when(recurring.deleteAll(any[UserId])).thenReturnUnit
      when(transactions.deleteAll(any[UserId])).thenReturnUnit

      val result = for
        userExists <- Ref.of[IO, Boolean](false)
        categoriesExist <- Ref.of[IO, Boolean](false)
        accountExists <- Ref.of[IO, Boolean](false)
        _ <- IO(when(repo.create(any[UserDetails], any[PasswordHash])).thenReturn(userExists.getAndSet(true).flatMap {
          case true => IO.raiseError(AppError.UserAlreadyExists(Users.email))
          case false => IO.pure(Users.uid1)
        }))
        _ <- IO(when(repo.delete(any[UserId])).thenReturn(userExists.set(false)))
        _ <- IO(when(categories.assignDefault(any[UserId])).thenReturn(categoriesExist.set(true)))
        _ <- IO(when(categories.deleteAll(any[UserId])).thenReturn(categoriesExist.set(false)))
        _ <- IO(when(accounts.deleteAll(any[UserId])).thenReturn(accountExists.set(false)))
        _ <- IO(when(accounts.createDefault(any[UserId], any[Currency])).thenReturn(
          accountExists.set(true) >> IO.raiseError(new RuntimeException("default setup failed after partial writes")),
          accountExists.set(true)
        ))
        dispatcher <- ActionDispatcher.make[IO]
        user <- UserService.make[IO](repo, encryptor, dispatcher)
        controller <- AuthController.make[IO](user, sessions)
        processor <- ActionProcessor.make[IO](dispatcher, user, categories, transactions, recurring, accounts)
        observations <- processor.run.compile.drain.background.use { _ =>
          for
            first <- controller.routes.orNotFound.run(signup)
            userAfterFailure <- userExists.get
            categoriesAfterFailure <- categoriesExist.get
            accountAfterFailure <- accountExists.get
            retry <- controller.routes.orNotFound.run(signup)
            userAfterRetry <- userExists.get
            categoriesAfterRetry <- categoriesExist.get
            accountAfterRetry <- accountExists.get
          yield (first.status, (userAfterFailure, categoriesAfterFailure, accountAfterFailure), retry.status,
            (userAfterRetry, categoriesAfterRetry, accountAfterRetry))
        }
      yield observations

      result.asserting { case (first, rolledBack, retry, created) =>
        first mustBe Status.InternalServerError
        rolledBack mustBe ((false, false, false))
        retry mustBe Status.Created
        created mustBe ((true, true, true))
        verify(repo).delete(Users.uid1)
        verify(accounts, times(2)).createDefault(any[UserId], any[Currency])
        succeed
      }
    }

    "return 201 only after default setup completes and propagate setup failure without queued retries" in {
      val repo = mock[UserRepository[IO]]
      val encryptor = mock[PasswordEncryptor[IO]]
      val sessions = mock[SessionService[IO]]
      val categories = mock[CategoryService[IO]]
      val transactions = mock[TransactionService[IO]]
      val recurring = mock[PeriodicTransactionService[IO]]
      val accounts = mock[AccountService[IO]]
      when(encryptor.hash(any[Password])).thenReturnIO(Users.hash)
      when(repo.create(any[UserDetails], any[PasswordHash])).thenReturnIO(Users.uid1)
      when(categories.assignDefault(any[UserId])).thenReturnUnit
      when(repo.delete(any[UserId])).thenReturnUnit
      when(recurring.deleteAll(any[UserId])).thenReturnUnit
      when(transactions.deleteAll(any[UserId])).thenReturnUnit
      when(categories.deleteAll(any[UserId])).thenReturnUnit
      when(accounts.deleteAll(any[UserId])).thenReturnUnit

      val result = for
        setupStarted <- Deferred[IO, Unit]
        releaseSetup <- Deferred[IO, Unit]
        returned <- Deferred[IO, Status]
        _ <- IO(when(accounts.createDefault(any[UserId], any[Currency])).thenReturn(
          setupStarted.complete(()).void >> releaseSetup.get,
          IO.raiseError(new RuntimeException("default setup failed"))
        ))
        dispatcher <- ActionDispatcher.make[IO]
        user <- UserService.make[IO](repo, encryptor, dispatcher)
        controller <- AuthController.make[IO](user, sessions)
        processor <- ActionProcessor.make[IO](dispatcher, user, categories, transactions, recurring, accounts)
        caller <- controller.routes.orNotFound.run(signup).flatTap(response => returned.complete(response.status)).start
        worker <- processor.run.take(1).compile.drain.start
        _ <- setupStarted.get
        before <- returned.tryGet
        _ <- releaseSetup.complete(())
        success <- caller.joinWithNever
        _ <- worker.joinWithNever
        failedCaller <- controller.routes.orNotFound.run(signup).start
        _ <- processor.run.take(2).compile.drain
        failure <- failedCaller.joinWithNever
        marker = Action.DeleteAllTransactions(Users.uid1)
        _ <- dispatcher.dispatch(marker)
        next <- dispatcher.stream.take(1).compile.lastOrError
      yield (before, success.status, failure.status, next, marker)

      result.asserting { case (before, success, failure, next, marker) =>
        before mustBe None
        success mustBe Status.Created
        failure mustBe Status.InternalServerError
        next mustBe marker
        verify(accounts, times(2)).createDefault(any[UserId], any[Currency])
        succeed
      }
    }
  }


  "DELETE /auth/user/data" should {
    List("empty" -> 0, "hidden-only" -> 1).foreach { case (label, initialRecords) =>
      s"wait for all deletion jobs even when visible lists are $label" in {
        val repo = mock[UserRepository[IO]]
        val encryptor = mock[PasswordEncryptor[IO]]
        val sessions = mock[SessionService[IO]]
        val categories = mock[CategoryService[IO]]
        val transactions = mock[TransactionService[IO]]
        val recurring = mock[PeriodicTransactionService[IO]]
        val accounts = mock[AccountService[IO]]
        when(recurring.deleteAll(any[UserId])).thenReturnUnit
        when(transactions.deleteAll(any[UserId])).thenReturnUnit
        when(categories.deleteAll(any[UserId])).thenReturnUnit

        val result = for
          remaining <- Ref.of[IO, Int](initialRecords)
          lastDeleteStarted <- Deferred[IO, Unit]
          releaseLastDelete <- Deferred[IO, Unit]
          returned <- Deferred[IO, Status]
          _ <- IO(when(accounts.deleteAll(any[UserId])).thenReturn(lastDeleteStarted.complete(()).void >> releaseLastDelete.get >> remaining.set(0)))
          dispatcher <- ActionDispatcher.make[IO]
          user <- UserService.make[IO](repo, encryptor, dispatcher)
          controller <- AuthController.make[IO](user, sessions)
          processor <- ActionProcessor.make[IO](dispatcher, user, categories, transactions, recurring, accounts)
          response <- processor.run.compile.drain.background.use { _ =>
            for
              caller <- controller.routes.orNotFound.run(request).flatTap(response => returned.complete(response.status)).start
              _ <- lastDeleteStarted.get
              before <- returned.tryGet
              _ <- releaseLastDelete.complete(())
              response <- caller.joinWithNever
              after <- remaining.get
            yield (before, response.status, after)
          }
        yield response

        result.asserting { case (before, status, remaining) =>
          before mustBe None
          status mustBe Status.NoContent
          remaining mustBe 0
          verify(recurring).deleteAll(Sessions.sess.userId)
          verify(transactions).deleteAll(Sessions.sess.userId)
          verify(categories).deleteAll(Sessions.sess.userId)
          verify(accounts).deleteAll(Sessions.sess.userId)
          verifyNoMoreInteractions(recurring, transactions, categories, accounts)
          verifyNoInteractions(repo, encryptor, sessions)
          succeed
        }
      }
    }

    "return an error on deletion failure and allow an explicit retry to finish" in {
      val repo = mock[UserRepository[IO]]
      val encryptor = mock[PasswordEncryptor[IO]]
      val sessions = mock[SessionService[IO]]
      val categories = mock[CategoryService[IO]]
      val transactions = mock[TransactionService[IO]]
      val recurring = mock[PeriodicTransactionService[IO]]
      val accounts = mock[AccountService[IO]]
      when(recurring.deleteAll(any[UserId])).thenReturnUnit
      when(transactions.deleteAll(any[UserId])).thenReturn(IO.raiseError(new RuntimeException("database unavailable")), IO.unit)
      when(categories.deleteAll(any[UserId])).thenReturnUnit
      when(accounts.deleteAll(any[UserId])).thenReturnUnit

      val result = for
        dispatcher <- ActionDispatcher.make[IO]
        user <- UserService.make[IO](repo, encryptor, dispatcher)
        controller <- AuthController.make[IO](user, sessions)
        processor <- ActionProcessor.make[IO](dispatcher, user, categories, transactions, recurring, accounts)
        responses <- processor.run.compile.drain.background.use { _ =>
          for
            first <- controller.routes.orNotFound.run(request)
            _ <- IO(verifyNoInteractions(categories, accounts))
            retry <- controller.routes.orNotFound.run(request)
          yield (first.status, retry.status)
        }
      yield responses

      result.asserting { case (first, retry) =>
        first mustBe Status.InternalServerError
        retry mustBe Status.NoContent
        verify(transactions, times(2)).deleteAll(Sessions.sess.userId)
        verify(accounts).deleteAll(Sessions.sess.userId)
        succeed
      }
    }
  }
}
