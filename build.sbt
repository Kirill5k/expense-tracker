import com.typesafe.sbt.packager.docker.*
import sbtghactions.JavaSpec

ThisBuild / scalaVersion                        := "3.5.1"
ThisBuild / version                             := scala.sys.process.Process("git rev-parse HEAD").!!.trim.slice(0, 7)
ThisBuild / organization                        := "io.github.kirill5k"
ThisBuild / githubWorkflowPublishTargetBranches := Nil
ThisBuild / githubWorkflowJavaVersions          := Seq(JavaSpec.temurin("23"))

val noPublish = Seq(
  publish         := {},
  publishLocal    := {},
  publishArtifact := false,
  publish / skip  := true
)

val docker = Seq(
  packageName        := moduleName.value,
  version            := version.value,
  maintainer         := "immotional@aol.com",
  dockerBaseImage    := "amazoncorretto:23-alpine",
  dockerUpdateLatest := true,
  dockerUsername     := sys.env.get("DOCKER_USERNAME"),
  dockerRepository   := sys.env.get("DOCKER_REPO_URI"),
  makeBatScripts     := Nil,
  dockerEnvVars ++= Map("VERSION" -> version.value),
  dockerCommands := {
    val commands         = dockerCommands.value
    val (stage0, stage1) = commands.span(_ != DockerStageBreak)
    val (before, after)  = stage1.splitAt(4)
    val installBash      = Cmd("RUN", "apk update && apk upgrade && apk add bash")
    stage0 ++ before ++ List(installBash) ++ after
  }
)

val core = project
  .in(file("modules/core"))
  .enablePlugins(JavaAppPackaging, JavaAgent, DockerPlugin)
  .settings(docker)
  .settings(
    name                 := "expense-tracker-core",
    moduleName           := "expense-tracker-core",
    Docker / packageName := "expense-tracker-core",
    libraryDependencies ++= Dependencies.core ++ Dependencies.test,
    Test / scalacOptions += "-Wconf:msg=unused value of type:silent"
  )

val openapi = project
  .in(file("modules/openapi"))
  .dependsOn(core)
  .settings(
    name       := "expense-tracker-openapi",
    moduleName := "expense-tracker-openapi",
    libraryDependencies ++= Dependencies.openapi
  )

val root = project
  .in(file("."))
  .settings(noPublish)
  .settings(
    name := "expense-tracker"
  )
  .aggregate(core)
