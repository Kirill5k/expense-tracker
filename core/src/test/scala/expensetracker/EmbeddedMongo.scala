package expensetracker

import cats.effect.{IO, Async, Resource}
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

import java.time.Instant
import scala.concurrent.duration._
import scala.jdk.CollectionConverters._

object EmbeddedMongo {
  private val starter = MongodStarter.getDefaultInstance

  def prepare[F[_]: Async](config: MongodConfig, attempt: Int = 5): F[MongodExecutable] =
    if (attempt < 0) Sync[F].raiseError(new RuntimeException("tried to prepare executable far too many times"))
    else
      Async[F].delay(starter.prepare(config)).handleErrorWith { _ =>
        Async[F].sleep(5.seconds) *> prepare[F](config, attempt - 1)
      }

  implicit final class MongodExecutableOps(private val ex: MongodExecutable) extends AnyVal {
    def startWithRetry[F[_]: Async](attempt: Int = 5): F[MongodProcess] =
      if (attempt < 0) Sync[F].raiseError(new RuntimeException("tried to prepare executable far too many times"))
      else
        Async[F].delay(ex.start()).handleErrorWith { _ =>
          Async[F].sleep(5.seconds) *> startWithRetry(attempt-1)
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
