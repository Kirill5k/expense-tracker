package expensetracker.auth

import cats.effect.IO
import expensetracker.CatsSpec
import expensetracker.auth.account.AccountService
import expensetracker.auth.session.SessionService

class AuthServiceSpec extends CatsSpec {

  "An AuthService" should {

  }

  def mocks: (AccountService[IO], SessionService[IO]) =
    (mock[AccountService[IO]], mock[SessionService[IO]])
}
