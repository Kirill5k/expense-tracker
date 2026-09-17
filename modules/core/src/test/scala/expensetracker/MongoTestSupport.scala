package expensetracker

import cats.effect.{IO, Resource}
import mongo4cats.embedded.EmbeddedMongo

import java.net.ServerSocket
import scala.util.Using

trait MongoTestSupport extends EmbeddedMongo {

  protected def withAvailableMongoPort[A](test: Int => IO[A]): IO[A] = {
    def start(remainingRetries: Int): Resource[IO, Int] =
      Resource
        .eval(IO.blocking(Using.resource(new ServerSocket(0))(_.getLocalPort)))
        .flatMap { port =>
          EmbeddedMongo.start[IO](port, mongoUsername, mongoPassword, mongoVersion, remainingAttempts = 0).map(_ => port)
        }
        .handleErrorWith { error =>
          val addressInUse = Iterator
            .iterate(Option(error))(_.flatMap(cause => Option(cause.getCause)))
            .takeWhile(_.isDefined)
            .flatten
            .exists(cause => Option(cause.getMessage).exists(_.contains("Address already in use")))
          // Another process can claim the port between closing the socket and MongoDB binding it.
          if addressInUse && remainingRetries > 0 then start(remainingRetries - 1)
          else Resource.raiseError[IO, Int, Throwable](error)
        }

    // Keep the test outside startup retries so a failed test is never run again.
    start(2).use(test)
  }
}
