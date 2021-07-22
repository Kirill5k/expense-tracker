package expensetracker

import cats.effect.{Async, IO, Resource}
import cats.effect.kernel.Sync
import cats.implicits._
import de.flapdoodle.embed.mongo.{MongodExecutable, MongodProcess, MongodStarter}
import de.flapdoodle.embed.mongo.config.{MongodConfig, Net}
import de.flapdoodle.embed.mongo.distribution.Version
import de.flapdoodle.embed.process.runtime.Network
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import org.bson.Document
import org.bson.types.ObjectId
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

import java.time.Instant
import scala.concurrent.duration._
import scala.jdk.CollectionConverters._

object EmbeddedMongo {

  private val starter             = MongodStarter.getDefaultInstance
  implicit val logger: Logger[IO] = Slf4jLogger.getLogger[IO]

  def prepare[F[_]: Async: Logger](config: MongodConfig, maxAttempts: Int = 5, attempt: Int = 0): F[MongodExecutable] =
    if (attempt >= maxAttempts)
      Sync[F].raiseError(new RuntimeException("tried to prepare executable far too many times"))
    else
      Async[F].delay(starter.prepare(config)).handleErrorWith { e =>
        Logger[F].error(e)(e.getMessage) *>
          Async[F].sleep(attempt.seconds) *>
          prepare[F](config, maxAttempts, attempt + 1)
      }

  implicit final class MongodExecutableOps(private val ex: MongodExecutable) extends AnyVal {
    def startWithRetry[F[_]: Async: Logger](maxAttempts: Int = 5, attempt: Int = 0): F[MongodProcess] =
      if (attempt >= maxAttempts)
        Sync[F].raiseError(new RuntimeException("tried to start executable far too many times"))
      else
        Async[F].delay(ex.start()).handleErrorWith { e =>
          Logger[F].error(e)(e.getMessage) *>
            Async[F].sleep(attempt.seconds) *>
            startWithRetry(maxAttempts, attempt + 1)
        }
  }
}

trait EmbeddedMongo {
  import EmbeddedMongo._

  protected val mongoHost = "localhost"
  protected val mongoPort = 12343

  def withRunningEmbeddedMongo[A](test: => IO[A]): IO[A] = {
    val mongodConfig = MongodConfig
      .builder()
      .version(Version.Main.PRODUCTION)
      .net(new Net(mongoHost, mongoPort, Network.localhostIsIPv6))
      .build

    Resource
      .make(EmbeddedMongo.prepare[IO](mongodConfig))(ex => IO(ex.stop()))
      .flatMap(ex => Resource.make(ex.startWithRetry[IO]())(pr => IO(pr.stop())))
      .use(_ => test)
      .timeout(5.minutes)
  }

  def categoryDoc(id: CategoryId, name: String, uid: Option[UserId] = None): Document =
    new Document(
      Map[String, Object](
        "_id"    -> new ObjectId(id.value),
        "kind"   -> "expense",
        "name"   -> name,
        "icon"   -> "icon",
        "color"  -> "#2962FF",
        "userId" -> uid.map(id => new ObjectId(id.value)).orNull
      ).asJava
    )

  def accDoc(id: UserId, email: String, password: String = "password"): Document =
    new Document(
      Map[String, Object](
        "_id"              -> new ObjectId(id.value),
        "email"            -> email,
        "password"         -> password,
        "name"             -> Document.parse("""{"first":"John","last":"Bloggs"}"""),
        "registrationDate" -> Instant.parse("2021-06-01T00:00:00Z")
      ).asJava
    )
}
