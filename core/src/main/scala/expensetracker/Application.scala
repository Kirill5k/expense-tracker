package expensetracker

import cats.effect.{IO, IOApp}
import expensetracker.common.config.AppConfig
import org.http4s.blaze.server.BlazeServerBuilder
import org.http4s.implicits._
import org.http4s.server.Router
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

import scala.concurrent.ExecutionContext

object Application extends IOApp.Simple {

  val config = AppConfig.load

  implicit val logger: Logger[IO] = Slf4jLogger.getLogger[IO]

  override val run: IO[Unit] =
    for {
      _ <- BlazeServerBuilder[IO](ExecutionContext.global)
        .bindHttp(config.server.port, config.server.host)
        .withHttpApp(Router[IO]().orNotFound)
        .serve
        .compile
        .drain
    } yield ()
}
