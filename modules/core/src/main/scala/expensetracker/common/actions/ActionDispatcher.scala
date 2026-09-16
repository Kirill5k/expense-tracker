package expensetracker.common.actions

import cats.effect.{Concurrent, Deferred, Outcome}
import cats.effect.std.Queue
import cats.syntax.applicativeError.*
import cats.syntax.flatMap.*
import cats.syntax.functor.*
import fs2.Stream

import java.util.concurrent.CancellationException

trait ActionDispatcher[F[_]]:
  def dispatch(action: Action): F[Unit]
  def dispatchAndAwait(action: Action): F[Unit]
  def stream: Stream[F, Action]
  def process(handle: Action => F[Unit], onBackgroundFailure: (Action, Throwable) => F[Unit]): Stream[F, Unit]

final private case class QueuedAction[F[_]](action: Action, completion: Option[Deferred[F, Either[Throwable, Unit]]])

final private class LiveActionDispatcher[F[_]](
    private val actions: Queue[F, QueuedAction[F]]
)(using F: Concurrent[F])
    extends ActionDispatcher[F]:
  override def dispatch(action: Action): F[Unit] = actions.offer(QueuedAction(action, None))

  override def dispatchAndAwait(action: Action): F[Unit] =
    for
      completion <- Deferred[F, Either[Throwable, Unit]]
      _          <- actions.offer(QueuedAction(action, Some(completion)))
      result     <- completion.get
      _          <- F.fromEither(result)
    yield ()

  // Kept for consumers inspecting fire-and-forget actions. Processing must retain the completion envelope.
  override def stream: Stream[F, Action] = Stream.fromQueueUnterminated(actions).map(_.action)

  override def process(handle: Action => F[Unit], onBackgroundFailure: (Action, Throwable) => F[Unit]): Stream[F, Unit] =
    Stream.fromQueueUnterminated(actions).parEvalMapUnordered(Int.MaxValue) { queued =>
      val run = handle(queued.action).attempt.flatMap { result =>
        queued.completion match
          case Some(completion) => completion.complete(result).void
          case None             => result.fold(error => onBackgroundFailure(queued.action, error), _ => F.unit)
      }
      F.guaranteeCase(run) {
        case Outcome.Canceled() =>
          queued.completion.fold(F.unit)(_.complete(Left(new CancellationException("Action processing was interrupted"))).void)
        case _ => F.unit
      }
    }

object ActionDispatcher:
  def make[F[_]: Concurrent]: F[ActionDispatcher[F]] =
    Queue.bounded[F, QueuedAction[F]](1024).map(q => LiveActionDispatcher[F](q))
