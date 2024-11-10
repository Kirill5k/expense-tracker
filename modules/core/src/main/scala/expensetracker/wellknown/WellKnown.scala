package expensetracker.wellknown

import cats.effect.Async
import cats.syntax.functor.*
import expensetracker.common.config.WellKnownConfig
import expensetracker.common.web.Controller

final class WellKnown[F[_]] private (
    val controller: Controller[F]
)

object WellKnown:
  def make[F[_]: Async](config: WellKnownConfig): F[WellKnown[F]] =
    WellKnownController.make[F](config).map(c => WellKnown[F](c))
