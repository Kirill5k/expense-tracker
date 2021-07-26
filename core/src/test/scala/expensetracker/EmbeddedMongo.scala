package expensetracker

import cats.effect.{Async, IO, Resource}
import cats.implicits._
import de.flapdoodle.embed.mongo.config.{MongodConfig, Net}
import de.flapdoodle.embed.mongo.distribution.Version
import de.flapdoodle.embed.mongo.{MongodProcess, MongodStarter}
import de.flapdoodle.embed.process.runtime.Network
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import mongo4cats.bson.Document
import org.bson.types.ObjectId
import org.slf4j.LoggerFactory

import java.time.Instant
import scala.concurrent.duration._

object EmbeddedMongo {

  private val starter = MongodStarter.getDefaultInstance
  private val logger  = LoggerFactory.getLogger("EmbeddedMongo")

  def start[F[_]: Async](
      config: MongodConfig,
      maxAttempts: Int = 10,
      attempt: Int = 0
  ): Resource[F, MongodProcess] =
    if (attempt >= maxAttempts) {
      Resource.eval(new RuntimeException("Failed to start embedded mongo too many times").raiseError[F, MongodProcess])
    } else {
      val process = for {
        ex <- Resource.make(Async[F].delay(starter.prepare(config)))(ex => Async[F].delay(ex.stop()))
        p  <- Resource.make(Async[F].delay(ex.start()))(p => Async[F].delay(p.stop()))
      } yield p

      process.handleErrorWith { e =>
        Resource.eval(Async[F].delay(logger.error(e.getMessage, e)) *> Async[F].sleep(attempt.seconds)) *>
          start[F](config, maxAttempts, attempt + 1)
      }
    }
}

trait EmbeddedMongo {

  protected val mongoHost = "localhost"
  protected val mongoPort = 12343

  def withRunningEmbeddedMongo[A](test: => IO[A]): IO[A] = {
    val mongodConfig = MongodConfig
      .builder()
      .version(Version.Main.PRODUCTION)
      .net(new Net(mongoHost, mongoPort, Network.localhostIsIPv6))
      .build

    EmbeddedMongo
      .start[IO](mongodConfig)
      .use(_ => test)
      .timeout(5.minutes)
  }

  def categoryDoc(id: CategoryId, name: String, uid: Option[UserId] = None): Document =
    Document(
      Map(
        "_id"    -> new ObjectId(id.value),
        "kind"   -> "expense",
        "name"   -> name,
        "icon"   -> "icon",
        "color"  -> "#2962FF",
        "userId" -> uid.map(id => new ObjectId(id.value)).orNull
      )
    )

  def accDoc(id: UserId, email: String, password: String = "password"): Document =
    Document(
      Map(
        "_id"              -> new ObjectId(id.value),
        "email"            -> email,
        "password"         -> password,
        "name"             -> Document.parse("""{"first":"John","last":"Bloggs"}"""),
        "registrationDate" -> Instant.parse("2021-06-01T00:00:00Z")
      )
    )
}
