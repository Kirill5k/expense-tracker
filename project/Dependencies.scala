import sbt.*

object Dependencies {
  object Versions {
    val mongo4cats   = "0.7.13"
    val commonScala  = "0.1.26"
    val pureConfig   = "0.17.9"
    val circe        = "0.14.14"
    val circeRefined = "0.15.1"
    val squants      = "1.8.3"
    val bcrypt       = "4.3.0"
    val refined      = "0.11.3"
    val logback      = "1.5.18"
    val log4cats     = "2.7.1"
    val tapir        = "1.11.34"
    val jwt          = "11.0.0"
    val apispec      = "0.11.3"
  }

  object Libraries {
    val squants = "org.typelevel"        %% "squants"      % Versions.squants
    val bcrypt  = "com.github.t3hnar"    %% "scala-bcrypt" % Versions.bcrypt
    val jwt     = "com.github.jwt-scala" %% "jwt-circe"    % Versions.jwt

    object commonScala {
      val cats       = "io.github.kirill5k" %% "common-cats"        % Versions.commonScala
      val http4s     = "io.github.kirill5k" %% "common-http4s"      % Versions.commonScala
      val syntax     = "io.github.kirill5k" %% "common-syntax"      % Versions.commonScala
      val http4sTest = "io.github.kirill5k" %% "common-http4s-test" % Versions.commonScala
    }

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
      val refined = "io.circe" %% "circe-refined" % Versions.circeRefined
      val parser  = "io.circe" %% "circe-parser"  % Versions.circe
      val all     = Seq(core, generic, refined, parser)
    }

    object refined {
      val core = "eu.timepit" %% "refined" % Versions.refined
      val all  = Seq(core)
    }

    object tapir {
      val core    = "com.softwaremill.sttp.tapir" %% "tapir-core"              % Versions.tapir
      val circe   = "com.softwaremill.sttp.tapir" %% "tapir-json-circe"        % Versions.tapir
      val http4s  = "com.softwaremill.sttp.tapir" %% "tapir-http4s-server"     % Versions.tapir
      val swagger = "com.softwaremill.sttp.tapir" %% "tapir-swagger-ui-bundle" % Versions.tapir
      val openapi = "com.softwaremill.sttp.tapir" %% "tapir-openapi-docs"      % Versions.tapir
      val all     = Seq(core, circe, http4s)
    }

    object apispec {
      val circeYaml = "com.softwaremill.sttp.apispec" %% "openapi-circe-yaml" % Versions.apispec
    }

  }

  lazy val core = Seq(
    Libraries.commonScala.syntax,
    Libraries.commonScala.cats,
    Libraries.commonScala.http4s,
    Libraries.mongo4cats.core,
    Libraries.mongo4cats.circe,
    Libraries.pureconfig.core,
    Libraries.squants,
    Libraries.jwt,
    Libraries.bcrypt.cross(CrossVersion.for3Use2_13)
  ) ++
    Libraries.circe.all ++
    Libraries.tapir.all ++
    Libraries.logging.all ++
    Libraries.refined.all

  lazy val test = Seq(
    Libraries.commonScala.http4sTest % Test,
    Libraries.mongo4cats.embedded    % Test
  )

  lazy val openapi = Seq(
    Libraries.commonScala.http4s,
    Libraries.tapir.swagger,
    Libraries.tapir.openapi,
    Libraries.apispec.circeYaml
  )
}
