import sbt._

object Dependencies {
  object Versions {
    val mongo4cats = "0.3.0"
    val pureConfig = "0.16.0"
    val circe      = "0.14.1"
    val http4s     = "1.0.0-M24"
    val logback    = "1.2.5"
    val log4cats   = "2.1.1"
    val squants    = "1.8.1"
    val bcrypt     = "4.3.0"
    val refined    = "0.9.27"

    val scalaTest = "3.2.9"
    val mockito   = "1.16.37"
  }

  object Libraries {
    val squants = "org.typelevel"     %% "squants"      % Versions.squants
    val bcrypt  = "com.github.t3hnar" %% "scala-bcrypt" % Versions.bcrypt

    object mongo4cats {
      val core     = "io.github.kirill5k" %% "mongo4cats-core"     % Versions.mongo4cats
      val circe    = "io.github.kirill5k" %% "mongo4cats-circe"    % Versions.mongo4cats
      val embedded = "io.github.kirill5k" %% "mongo4cats-embedded" % Versions.mongo4cats
    }

    object pureconfig {
      val core = "com.github.pureconfig" %% "pureconfig" % Versions.pureConfig
    }

    object logging {
      val logback  = "ch.qos.logback" % "logback-classic" % Versions.logback
      val log4cats = "org.typelevel" %% "log4cats-slf4j"  % Versions.log4cats

      val all = Seq(log4cats, logback)
    }

    object circe {
      val core    = "io.circe" %% "circe-core"    % Versions.circe
      val generic = "io.circe" %% "circe-generic" % Versions.circe
      val refined = "io.circe" %% "circe-refined" % Versions.circe
      val parser  = "io.circe" %% "circe-parser"  % Versions.circe

      val all = Seq(core, generic, refined, parser)
    }

    object refined {
      val core = "eu.timepit" %% "refined"      % Versions.refined
      val cats = "eu.timepit" %% "refined-cats" % Versions.refined

      val all = Seq(core, cats)
    }

    object http4s {
      val core   = "org.http4s" %% "http4s-core"         % Versions.http4s
      val dsl    = "org.http4s" %% "http4s-dsl"          % Versions.http4s
      val server = "org.http4s" %% "http4s-server"       % Versions.http4s
      val blaze  = "org.http4s" %% "http4s-blaze-server" % Versions.http4s
      val circe  = "org.http4s" %% "http4s-circe"        % Versions.http4s

      val all = Seq(core, dsl, server, blaze, circe)
    }

    val scalaTest        = "org.scalatest" %% "scalatest"               % Versions.scalaTest
    val mockitoCore      = "org.mockito"   %% "mockito-scala"           % Versions.mockito
    val mockitoScalatest = "org.mockito"   %% "mockito-scala-scalatest" % Versions.mockito
  }

  lazy val core = Seq(
    Libraries.mongo4cats.core,
    Libraries.mongo4cats.circe,
    Libraries.pureconfig.core,
    Libraries.squants,
    Libraries.bcrypt
  ) ++
    Libraries.circe.all ++
    Libraries.http4s.all ++
    Libraries.logging.all ++
    Libraries.refined.all

  lazy val test = Seq(
    Libraries.scalaTest           % Test,
    Libraries.mockitoCore         % Test,
    Libraries.mockitoScalatest    % Test,
    Libraries.mongo4cats.embedded % Test
  )
}
