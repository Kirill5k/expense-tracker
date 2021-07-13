package expensetracker

import de.flapdoodle.embed.mongo.{MongodExecutable, MongodProcess, MongodStarter}
import de.flapdoodle.embed.mongo.config.{MongodConfig, Net}
import de.flapdoodle.embed.mongo.distribution.Version
import de.flapdoodle.embed.process.runtime.Network
import expensetracker.auth.user.UserId
import expensetracker.category.CategoryId
import org.bson.Document
import org.bson.types.ObjectId

import java.time.Instant
import scala.jdk.CollectionConverters._
import scala.util.Try

object EmbeddedMongo {
  private val starter = MongodStarter.getDefaultInstance

  def prepare(config: MongodConfig, attempt: Int = 5): MongodExecutable =
    if (attempt < 0) throw new RuntimeException("tried to prepare executable far too many times")
    else Try(starter.prepare(config)).getOrElse(prepare(config, attempt - 1))
}

trait EmbeddedMongo {

  protected val mongoHost = "localhost"
  protected val mongoPort = 12343

  def withRunningEmbeddedMongo[A](test: => A): A = {
    val mongodConfig = MongodConfig
      .builder()
      .version(Version.Main.PRODUCTION)
      .net(new Net(mongoHost, mongoPort, Network.localhostIsIPv6))
      .build
    val mongodExecutable: MongodExecutable = EmbeddedMongo.prepare(mongodConfig)
    var mongodProcess: MongodProcess = null
    try {
      mongodProcess = mongodExecutable.start
      test
    } finally {
      if (mongodProcess != null) mongodProcess.stop()
      if (mongodExecutable != null) mongodExecutable.stop()
    }
  }

  def categoryDoc(id: CategoryId, name: String, uid: Option[UserId] = None): Document =
    new Document(
      Map[String, Object](
        "_id"       -> new ObjectId(id.value),
        "kind"      -> "expense",
        "name"      -> name,
        "icon"      -> "icon",
        "color"     -> "#2962FF",
        "accountId" -> uid.map(id => new ObjectId(id.value)).orNull
      ).asJava
    )

  def accDoc(id: UserId, email: String, password: String = "password"): Document =
    new Document(
      Map[String, Object](
        "_id"      -> new ObjectId(id.value),
        "email"    -> email,
        "password" -> password,
        "name"     -> Document.parse("""{"first":"John","last":"Bloggs"}"""),
        "registrationDate" -> Instant.parse("2021-06-01T00:00:00Z")
      ).asJava
    )
}
