import sbt.*

object Dependencies {
  object Versions {
    val mongo4cats = "0.6.17"
    val pureConfig = "0.17.5"
    val circe      = "0.14.6"
    val http4s     = "0.23.25"
    val squants    = "1.8.3"
    val bcrypt     = "4.3.0"
    val refined    = "0.11.1"
    val logback    = "1.4.14"
    val log4cats   = "2.6.0"
    val tapir      = "1.9.7"
    val jwt        = "10.0.0"

    val scalaTest = "3.2.17"
    val mockito   = "3.2.17.0"
  }

  object Libraries {
    val squants = "org.typelevel"        %% "squants"      % Versions.squants
    val bcrypt  = "com.github.t3hnar"    %% "scala-bcrypt" % Versions.bcrypt
    val jwt     = "com.github.jwt-scala" %% "jwt-circe"    % Versions.jwt

    object mongo4cats {
      val core     = "io.github.kirill5k" %% "mongo4cats-core"     % Versions.mongo4cats
      val circe    = "io.github.kirill5k" %% "mongo4cats-circe"    % Versions.mongo4cats
      val embedded = "io.github.kirill5k" %% "mongo4cats-embedded" % Versions.mongo4cats
    }

    object pureconfig {
      val core = "com.github.pureconfig" %% "pureconfig-core" % Versions.pureConfig
    }

    object logging {
      val logback  = "ch.qos.logback" % "logback-classic" % Versions.logback
      val log4cats = "org.typelevel" %% "log4cats-slf4j"  % Versions.log4cats
      val all      = Seq(log4cats, logback)
    }

    object circe {
      val core    = "io.circe" %% "circe-core"    % Versions.circe
      val generic = "io.circe" %% "circe-generic" % Versions.circe
      val refined = "io.circe" %% "circe-refined" % Versions.circe
      val parser  = "io.circe" %% "circe-parser"  % Versions.circe
      val all     = Seq(core, generic, refined, parser)
    }

    object refined {
      val core = "eu.timepit" %% "refined" % Versions.refined
      val all  = Seq(core)
    }

    object http4s {
      val emberServer = "org.http4s" %% "http4s-ember-server" % Versions.http4s
    }

    object tapir {
      val core    = "com.softwaremill.sttp.tapir" %% "tapir-core"              % Versions.tapir
      val circe   = "com.softwaremill.sttp.tapir" %% "tapir-json-circe"        % Versions.tapir
      val http4s  = "com.softwaremill.sttp.tapir" %% "tapir-http4s-server"     % Versions.tapir
      val swagger = "com.softwaremill.sttp.tapir" %% "tapir-swagger-ui-bundle" % Versions.tapir
      val all     = Seq(core, circe, http4s)
    }

    val scalaTest = "org.scalatest"     %% "scalatest"   % Versions.scalaTest
    val mockito   = "org.scalatestplus" %% "mockito-4-11" % Versions.mockito
  }

  lazy val core = Seq(
    Libraries.mongo4cats.core,
    Libraries.mongo4cats.circe,
    Libraries.pureconfig.core,
    Libraries.squants,
    Libraries.jwt,
    Libraries.http4s.emberServer,
    Libraries.bcrypt.cross(CrossVersion.for3Use2_13)
  ) ++
    Libraries.circe.all ++
    Libraries.tapir.all ++
    Libraries.logging.all ++
    Libraries.refined.all

  lazy val test = Seq(
    Libraries.scalaTest           % Test,
    Libraries.mockito             % Test,
    Libraries.mongo4cats.embedded % Test
  )

  lazy val openapi = Seq(
    Libraries.tapir.swagger
  )
}
