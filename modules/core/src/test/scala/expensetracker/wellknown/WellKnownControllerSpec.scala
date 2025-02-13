package expensetracker.wellknown

import cats.effect.IO
import expensetracker.auth.Authenticator
import expensetracker.common.config.{WellKnownAppleConfig, WellKnownConfig}
import expensetracker.fixtures.Sessions
import kirill5k.common.http4s.test.HttpRoutesWordSpec
import org.http4s.implicits.*
import org.http4s.{Method, Request, Status, Uri}

class WellKnownControllerSpec extends HttpRoutesWordSpec:
  "A WellKnownController" when {
    given Authenticator[IO] = _ => IO.pure(Sessions.sess)

    val config = WellKnownConfig(
      apple = WellKnownAppleConfig(
        bundleId = "bundleId",
        developerId = "developerId"
      )
    )

    "GET /.well-known/apple-app-site-association" should {
      "return status 200 and Content-Type header" in {
        val req = Request[IO](uri = uri"/.well-known/apple-app-site-association", method = Method.GET)
        val res = WellKnownController.make[IO](config).flatMap(_.routes.orNotFound.run(req))

        res mustContainHeaders Map("Content-Type" -> "application/json")
        res mustHaveStatus (Status.Ok, Some(
          """
            |{
            |  "applinks" : {
            |    "apps" : [
            |    ],
            |    "details" : [
            |      {
            |        "appID" : "developerId.bundleId",
            |        "paths" : [
            |          "/"
            |        ]
            |      }
            |    ]
            |  },
            |  "activitycontinuation" : {
            |    "apps" : [
            |      "developerId.bundleId"
            |    ]
            |  },
            |  "webcredentials" : {
            |    "apps" : [
            |      "developerId.bundleId"
            |    ]
            |  }
            |}
            |""".stripMargin))
      }
    }
  }
