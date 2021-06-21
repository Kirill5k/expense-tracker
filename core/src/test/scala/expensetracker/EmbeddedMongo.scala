package expensetracker

import de.flapdoodle.embed.mongo.MongodStarter
import de.flapdoodle.embed.mongo.config.{MongodConfig, Net}
import de.flapdoodle.embed.mongo.distribution.Version
import de.flapdoodle.embed.process.runtime.Network
import expensetracker.category.CategoryId
import expensetracker.auth.account.AccountId
import org.bson.Document
import org.bson.types.ObjectId

import scala.jdk.CollectionConverters._

trait EmbeddedMongo {

  def withRunningEmbeddedMongo[A](host: String = "localhost", port: Int = 12345)(test: => A): A = {
    val starter = MongodStarter.getDefaultInstance
    val mongodConfig = MongodConfig
      .builder()
      .version(Version.Main.PRODUCTION)
      .net(new Net(host, port, Network.localhostIsIPv6))
      .build
    val mongodExecutable = starter.prepare(mongodConfig)
    try {
      val _ = mongodExecutable.start
      test
    } finally mongodExecutable.stop()
  }

  def categoryDoc(id: CategoryId, name: String, uid: Option[AccountId] = None): Document =
    new Document(
      Map[String, Object](
        "_id"       -> new ObjectId(id.value),
        "kind"      -> "expense",
        "name"      -> name,
        "icon"      -> "icon",
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
