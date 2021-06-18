package expensetracker

import cats.effect.{IO, IOApp}
import expensetracker.auth.Auth
import expensetracker.category.Categories
import expensetracker.common.config.AppConfig
import org.http4s.blaze.server.BlazeServerBuilder
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

import scala.concurrent.ExecutionContext

object Application extends IOApp.Simple {

  val config = AppConfig.load

  implicit val logger: Logger[IO] = Slf4jLogger.getLogger[IO]

  override val run: IO[Unit] =
    Resources.make[IO](config).use { res =>
      for {
        auth <- Auth.make(config.auth, res)
        cats <- Categories.make(res)
        http <- Http.make(auth, cats)
        _ <- BlazeServerBuilder[IO](ExecutionContext.global)
          .bindHttp(config.server.port, config.server.host)
          .withHttpApp(http.httpApp)
          .serve
          .compile
          .drain
      } yield ()
    }
}
