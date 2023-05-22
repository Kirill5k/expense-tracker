package expensetracker

import cats.effect.Async
import com.comcast.ip4s.*
import expensetracker.common.config.ServerConfig
import org.http4s.HttpApp
import org.http4s.ember.server.EmberServerBuilder
import fs2.Stream
import fs2.io.net.Network

import scala.concurrent.duration.*

object Server:
  def serve[F[_]](config: ServerConfig, routes: HttpApp[F])(using F: Async[F]): Stream[F, Unit] = {
    Stream.eval {
      EmberServerBuilder
        .default(F, Network.forAsync[F])
        .withHost(Ipv4Address.fromString(config.host).get)
        .withPort(Port.fromInt(config.port).get)
        .withHttpApp(routes)
        .withIdleTimeout(1.hour)
        .build
        .use(_ => Async[F].never)
    }.drain
  }
