package expensetracker

import com.comcast.ip4s.IpAddress
import expensetracker.auth.account._
import expensetracker.auth.session.{Session, SessionActivity, SessionId}
import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryKind, CategoryName}
import org.bson.types.ObjectId
import org.http4s.RequestCookie

import java.time.Instant

trait TestData {

  val aid     = AccountId(new ObjectId().toHexString)
  val pwd     = Password("pwd")
  val hash    = PasswordHash("hash")
  val email   = AccountEmail("email")
  val details = AccountDetails(email, AccountName("John", "Bloggs"))
  val acc     = Account(aid, details.email, details.name, hash)

  val cid   = CategoryId("AB0C5342AB0C5342AB0C5342")
  val cname = CategoryName("cat-1")
  val cat   = Category(cid, CategoryKind.Expense, cname, CategoryIcon("icon"), Some(aid))

  val sid             = SessionId(new ObjectId().toHexString)
  val sa              = IpAddress.fromString("192.168.0.1").map(ip => SessionActivity(ip, Instant.now()))
  val sess            = Session(sid, aid, Instant.now(), Instant.now().plusSeconds(100000L), sa)
  val sessionIdCookie = RequestCookie("session-id", sid.value)
}
