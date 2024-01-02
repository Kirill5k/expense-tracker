package expensetracker.auth

import expensetracker.auth.jwt.BearerToken
import expensetracker.auth.session.Session

trait Authenticator[F[_]]:
  def authenticate(token: BearerToken): F[Session]
