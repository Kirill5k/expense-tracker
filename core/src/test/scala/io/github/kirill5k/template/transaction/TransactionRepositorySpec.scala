package io.github.kirill5k.template.transaction

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import io.github.kirill5k.template.EmbeddedMongo
import io.github.kirill5k.template.category.CategoryId
import io.github.kirill5k.template.user.UserId
import mongo4cats.client.MongoClientF
import org.bson.Document
import org.bson.types.ObjectId
import org.scalatest.matchers.must.Matchers
import org.scalatest.wordspec.AnyWordSpec

import scala.jdk.CollectionConverters._

class TransactionRepositorySpec extends AnyWordSpec with EmbeddedMongo with Matchers {

  val userId = UserId(new ObjectId().toHexString)
  val cat1Id = CategoryId(new ObjectId().toHexString)
  val cat2Id = CategoryId(new ObjectId().toHexString)

  "A TransactionRepository" should {

    ""

  }

  def withEmbeddedMongoClient[A](test: MongoClientF[IO] => IO[A]): A =
    withRunningEmbeddedMongo() {
      MongoClientF
        .fromConnectionString[IO]("mongodb://localhost:12345")
        .use { client =>
          for {
            db         <- client.getDatabase("expense-tracker")
            categories <- db.getCollection("categories")
            _ <- categories.insertMany[IO](List(categoryDoc(cat1Id, "category-1"), categoryDoc(cat2Id, "category-2")))
            users <- db.getCollection("users")
            _     <- users.insertOne[IO](userDoc(userId, "user-1"))
            res   <- test(client)
          } yield res
        }
        .unsafeRunSync()
    }

  def categoryDoc(id: CategoryId, name: String): Document =
    new Document(Map[String, Object]("id" -> new ObjectId(id.value), "name" -> name, "icon" -> "icon1").asJava)

  def userDoc(id: UserId, name: String): Document =
    new Document(Map[String, Object]("id" -> new ObjectId(id.value), "name" -> name, "password" -> "password").asJava)
}
