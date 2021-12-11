package expensetracker

import com.comcast.ip4s.IpAddress
import expensetracker.auth.user._
import expensetracker.auth.session.{Session, SessionActivity, SessionId, SessionStatus}
import expensetracker.category.{Category, CategoryColor, CategoryIcon, CategoryId, CategoryKind, CategoryName}
import expensetracker.transaction.{Transaction, TransactionId, TransactionKind}
import mongo4cats.bson.ObjectId
import org.http4s.RequestCookie
import squants.market.GBP

import java.time.{Instant, LocalDate}

trait TestData {

  val regDate = Instant.parse("2021-06-01T00:00:00Z")

  val uid     = UserId("60e70e87fb134e0c1a271121")
  val pwd     = Password("pwd")
  val hash    = PasswordHash("hash")
  val email   = UserEmail("email")
  val details = UserDetails(email, UserName("John", "Bloggs"))
  val user    = User(uid, details.email, details.name, hash, UserSettings.Default, regDate)

  val cid   = CategoryId("AB0C5342AB0C5342AB0C5342")
  val cname = CategoryName("cat-1")
  val cat   = Category(cid, CategoryKind.Expense, cname, CategoryIcon("icon"), CategoryColor.Blue, Some(uid))

  val txid = TransactionId("BC0C5342AB0C5342AB0C5342")
  val tx   = Transaction(txid, uid, TransactionKind.Expense, cid, GBP(10.99), LocalDate.parse("2021-06-06"), Some("test tx"), Set("test"))

  val sid          = SessionId(ObjectId().toHexString)
  val sid2         = SessionId(ObjectId().toHexString)
  val sa           = IpAddress.fromString("192.168.0.1").map(ip => SessionActivity(ip, Instant.now()))
  val sess         = Session(sid, uid, Instant.now(), true, SessionStatus.Authenticated, sa)
  val sessIdCookie = RequestCookie("session-id", sid.value)
}
