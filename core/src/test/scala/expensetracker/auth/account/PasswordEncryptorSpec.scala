package expensetracker.auth.account

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import expensetracker.CatsSpec
import expensetracker.common.config.AuthConfig

class PasswordEncryptorSpec extends CatsSpec {

  val authConfig = AuthConfig("$2a$10$8K1p/a0dL1LXMIgoEDFrwO")

  "A PasswordEncryptor" should {

    "hash and validate password with salt" in {
      val result = for {
        e       <- PasswordEncryptor.make[IO](authConfig)
        hash    <- e.hash(Password("Password123!"))
        isValid <- e.isValid(Password("Password123!"), hash)
      } yield isValid

      result.unsafeToFuture().map { isValid =>
        isValid mustBe true
      }
    }
  }
}
