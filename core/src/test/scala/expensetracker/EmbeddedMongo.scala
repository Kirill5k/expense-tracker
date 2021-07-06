package expensetracker

import de.flapdoodle.embed.mongo.MongodStarter
import de.flapdoodle.embed.mongo.config.{MongodConfig, Net}
import de.flapdoodle.embed.mongo.distribution.Version
import de.flapdoodle.embed.process.runtime.Network
import expensetracker.category.CategoryId
import expensetracker.auth.account.AccountId
import org.bson.Document
import org.bson.types.ObjectId

import java.io.File
import java.nio.file.Files
import scala.jdk.CollectionConverters._

trait EmbeddedMongo {

  private def clearResources(): Unit = {
    val tempFile = System.getenv("temp") + File.separator + "extract-" + System.getenv("USERNAME") + "-extractmongod";
    val extension = if (System.getenv("OS") != null && System.getenv("OS").contains("Windows")) ".exe" else ".sh"
    Files.deleteIfExists(new File(s"$tempFile$extension").toPath)
    Files.deleteIfExists(new File(tempFile + ".pid").toPath)
    ()
  }

  def withRunningEmbeddedMongo[A](host: String = "localhost", port: Int = 12345)(test: => A): A = {
    clearResources()
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
