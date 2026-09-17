package expensetracker

import cats.effect.{IO, Ref}
import kirill5k.common.cats.test.IOWordSpec
import mongo4cats.bson.Document
import mongo4cats.client.MongoClient

import java.net.{InetSocketAddress, ServerSocket}
import scala.util.Using

class MongoTestSupportSpec extends IOWordSpec with MongoTestSupport {

  "MongoTestSupport" should {
    "keep overlapping instances on separate ports with isolated data" in {
      val result = withAvailableMongoPort { firstPort =>
        MongoClient.fromConnectionString[IO](s"mongodb://localhost:$firstPort").use { firstClient =>
          for
            firstDatabase   <- firstClient.getDatabase("mongo-test-support")
            firstCollection <- firstDatabase.getCollection("records")
            _               <- firstCollection.insertOne(Document.parse("""{"name":"synthetic record"}"""))
            counts          <- withAvailableMongoPort { secondPort =>
              MongoClient.fromConnectionString[IO](s"mongodb://localhost:$secondPort").use { secondClient =>
                for
                  secondDatabase   <- secondClient.getDatabase("mongo-test-support")
                  secondCollection <- secondDatabase.getCollection("records")
                  firstCount       <- firstCollection.count
                  secondCount      <- secondCollection.count
                yield (firstPort, secondPort, firstCount, secondCount)
              }
            }
          yield counts
        }
      }

      result.asserting { case (firstPort, secondPort, firstCount, secondCount) =>
        firstPort must not be secondPort
        firstCount mustBe 1L
        secondCount mustBe 0L
      }
    }

    "propagate a callback failure once and release its port" in {
      val failure = new RuntimeException("Address already in use")
      val result  = for
        attempts <- Ref.of[IO, List[Int]](Nil)
        outcome  <- withAvailableMongoPort { port =>
          attempts.update(_ :+ port) >> IO.raiseError[Unit](failure)
        }.attempt
        ports    <- attempts.get
        reusable <- IO.blocking {
          Using.resource(new ServerSocket()) { socket =>
            socket.setReuseAddress(true)
            socket.bind(new InetSocketAddress("localhost", ports.head))
            socket.isBound
          }
        }
      yield (outcome, ports, reusable)

      result.asserting { case (outcome, ports, reusable) =>
        outcome mustBe Left(failure)
        ports must have size 1
        reusable mustBe true
      }
    }
  }
}
