package expensetracker.common.web

import org.http4s.dsl.Http4sDsl

final case class ErrorResponse(message: String)

trait Controller[F[_]] extends Http4sDsl[F]
