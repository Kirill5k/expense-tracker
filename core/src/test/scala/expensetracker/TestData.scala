package expensetracker

import expensetracker.auth.account.{AccountDetails, AccountEmail, AccountId, AccountName, Password, PasswordHash}
import expensetracker.auth.session.{Session, SessionId}
import expensetracker.category.{Category, CategoryIcon, CategoryId, CategoryName}
import org.bson.types.ObjectId
import org.http4s.RequestCookie

import java.time.Instant

trait TestData {

  val aid     = AccountId(new ObjectId().toHexString)
  val pwd     = Password("pwd")
  val hash    = PasswordHash("hash")
  val email   = AccountEmail("email")
  val details = AccountDetails(email, AccountName("John", "Bloggs"))

  val cid   = CategoryId("AB0C5342AB0C5342AB0C5342")
  val cname = CategoryName("cat-1")
  val cat   = Category(cid, cname, CategoryIcon("icon"), Some(aid))

  val sid             = SessionId(new ObjectId().toHexString)
  val sess            = Session(sid, aid, Instant.now(), Instant.now().plusSeconds(100000L))
  val sessionIdCookie = RequestCookie("session-id", sid.value)
}
