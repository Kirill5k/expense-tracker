package expensetracker

import de.flapdoodle.embed.mongo.{MongodExecutable, MongodProcess, MongodStarter}
import de.flapdoodle.embed.mongo.config.{MongodConfig, Net}
import de.flapdoodle.embed.mongo.distribution.Version
import de.flapdoodle.embed.process.runtime.Network
import expensetracker.auth.account.AccountId
import expensetracker.category.CategoryId
import org.bson.Document
import org.bson.types.ObjectId

import scala.jdk.CollectionConverters._

object EmbeddedMongo {
  val starter = MongodStarter.getDefaultInstance
}

trait EmbeddedMongo {

  protected val mongoHost = "localhost"
  protected val mongoPort = 12345

  private val mongodConfig = MongodConfig
    .builder()
    .version(Version.Main.PRODUCTION)
    .net(new Net(mongoHost, mongoPort, Network.localhostIsIPv6))
    .build

  def withRunningEmbeddedMongo[A](test: => A): A = {
    val mongoExecutable: MongodExecutable = EmbeddedMongo.starter.prepare(mongodConfig)
    var mongoProcess: MongodProcess = null
    try {
      mongoProcess = mongoExecutable.start
      test
    } finally {
      if (mongoProcess != null) mongoProcess.stop()
      if (mongoExecutable != null) mongoExecutable.stop()
    }
  }

  def categoryDoc(id: CategoryId, name: String, uid: Option[AccountId] = None): Document =
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

  def accDoc(id: AccountId, email: String, password: String = "password"): Document =
    new Document(
      Map[String, Object](
        "_id"      -> new ObjectId(id.value),
        "email"    -> email,
        "password" -> password,
        "name"     -> Document.parse("""{"first":"John","last":"Bloggs"}""")
      ).asJava
    )
}
