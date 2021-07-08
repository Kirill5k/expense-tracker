package expensetracker

import com.comcast.ip4s.IpAddress
import expensetracker.auth.account._
import expensetracker.auth.session.{Session, SessionActivity, SessionId, SessionStatus}
import expensetracker.category.{Category, CategoryColor, CategoryIcon, CategoryId, CategoryKind, CategoryName}
import expensetracker.transaction.{Transaction, TransactionId, TransactionKind}
import org.bson.types.ObjectId
import org.http4s.RequestCookie
import squants.market.GBP

import java.time.Instant

trait TestData {

  val regDate = Instant.parse("2021-06-01T00:00:00Z")

  val aid     = AccountId(new ObjectId().toHexString)
  val pwd     = Password("pwd")
  val hash    = PasswordHash("hash")
  val email   = AccountEmail("email")
  val details = AccountDetails(email, AccountName("John", "Bloggs"))
  val acc     = Account(aid, details.email, details.name, hash, AccountSettings(GBP), regDate)

  val cid   = CategoryId("AB0C5342AB0C5342AB0C5342")
  val cname = CategoryName("cat-1")
  val cat   = Category(cid, CategoryKind.Expense, cname, CategoryIcon("icon"), CategoryColor.Blue, Some(aid))

  val txid = TransactionId("BC0C5342AB0C5342AB0C5342")
  val tx   = Transaction(txid, aid, TransactionKind.Expense, cid, GBP(10.99), Instant.parse("2021-06-06T00:00:00Z"), Some("test tx"))

  val sid             = SessionId(new ObjectId().toHexString)
  val sa              = IpAddress.fromString("192.168.0.1").map(ip => SessionActivity(ip, Instant.now()))
  val sess            = Session(sid, aid, Instant.now(), true, SessionStatus.Authenticated, sa)
  val sessIdCookie = RequestCookie("session-id", sid.value)
}
