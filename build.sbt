import com.typesafe.sbt.packager.docker._

ThisBuild / scalaVersion := "3.1.0"
ThisBuild / version := scala.sys.process.Process("git rev-parse HEAD").!!.trim.slice(0, 7)
ThisBuild / organization := "io.github.kirill5k"

lazy val noPublish = Seq(
  publish := {},
  publishLocal := {},
  publishArtifact := false,
  publish / skip := true
)

lazy val docker = Seq(
  packageName := moduleName.value,
  version := version.value,
  maintainer := "immotional@aol.com",
  dockerBaseImage := "amazoncorretto:17.0.1-alpine",
  dockerUpdateLatest := true,
  dockerUsername := sys.env.get("DOCKER_USERNAME"),
  dockerRepository := sys.env.get("DOCKER_REPO_URI"),
  makeBatScripts := Nil,
  dockerCommands := {
    val commands         = dockerCommands.value
    val (stage0, stage1) = commands.span(_ != DockerStageBreak)
    val (before, after)  = stage1.splitAt(4)
    val installBash      = Cmd("RUN", "apk update && apk upgrade && apk add bash")
    stage0 ++ before ++ List(installBash) ++ after
  }
)

lazy val root = project
  .in(file("."))
  .settings(noPublish)
  .settings(
    name := "expense-tracker"
  )
  .aggregate(core)

lazy val core = project
  .in(file("core"))
  .enablePlugins(JavaAppPackaging, JavaAgent, DockerPlugin)
  .settings(docker)
  .settings(
    name := "expense-tracker-core",
    moduleName := "expense-tracker-core",
    Docker / packageName := "expense-tracker-core",
    libraryDependencies ++= Dependencies.core ++ Dependencies.test
  )
