package expensetracker

import de.flapdoodle.embed.mongo.MongodStarter
import de.flapdoodle.embed.mongo.config.{MongodConfig, Net}
import de.flapdoodle.embed.mongo.distribution.Version
import de.flapdoodle.embed.process.runtime.Network
import expensetracker.category.CategoryId
import expensetracker.auth.user.UserId
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

  def categoryDoc(id: CategoryId, name: String, uid: Option[UserId] = None): Document =
    new Document(
      Map[String, Object](
        "id"     -> new ObjectId(id.value),
        "name"   -> name,
        "icon"   -> "icon",
        "userId" -> uid.map(id => new ObjectId(id.value)).orNull
      ).asJava
    )

  def userDoc(id: UserId, name: String): Document =
    new Document(Map[String, Object]("id" -> new ObjectId(id.value), "name" -> name, "password" -> "password").asJava)
}
