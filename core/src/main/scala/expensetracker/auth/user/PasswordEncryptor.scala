package expensetracker.auth.user

import cats.effect.Sync
import cats.implicits.*
import com.github.t3hnar.bcrypt.*
import expensetracker.common.config.AuthConfig

trait PasswordEncryptor[F[_]]:
  def hash(password: Password): F[PasswordHash]
  def isValid(password: Password, passwordHash: PasswordHash): F[Boolean]

object PasswordEncryptor:
  def make[F[_]: Sync](config: AuthConfig): F[PasswordEncryptor[F]] =
    Sync[F].pure {
      new PasswordEncryptor[F] {
        override def hash(password: Password): F[PasswordHash] =
          Sync[F].delay(password.value.bcryptBounded(config.passwordSalt)).map(s => PasswordHash(s))

        override def isValid(password: Password, passwordHash: PasswordHash): F[Boolean] =
          Sync[F].fromTry(password.value.isBcryptedSafeBounded(passwordHash.value))
      }
    }
