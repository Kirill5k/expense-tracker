package expensetracker.common

import cats.Functor
import cats.syntax.functor.*

object effects {

  extension [F[_], A](fo: F[Option[A]])
    def mapOpt[B](f: A => B)(using F: Functor[F]): F[Option[B]] =
      fo.map(_.map(f))

  extension[F[_], A] (fo: F[Iterable[A]])
    def mapList[B](f: A => B)(using F: Functor[F]): F[List[B]] =
      fo.map(_.map(f).toList)
}
