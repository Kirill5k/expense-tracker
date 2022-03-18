package expensetracker.common.web

import expensetracker.common.JsonCodecs
import expensetracker.common.jwt.BearerToken
import expensetracker.common.web.ErrorResponse
import sttp.tapir.generic.SchemaDerivation
import sttp.tapir.json.circe.TapirJsonCirce
import sttp.tapir.*
import sttp.tapir.model.ServerRequest

import java.net.{InetAddress, InetSocketAddress}

final case class RequestInfo(from: Option[InetSocketAddress])

trait SecuredController[F[_]] extends TapirJsonCirce with SchemaDerivation with JsonCodecs {

  protected val securedEndpoint =
    endpoint
      .securityIn(auth.bearer[String]().map(BearerToken.apply)(_.value))
      .in(extractFromRequest(req => RequestInfo(req.connectionInfo.remote)))
      .errorOut(statusCode.and(jsonBody[ErrorResponse]))

}
