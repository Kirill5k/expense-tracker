export type CleanupStatus = { running: boolean; error: string };
type CleanupStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};
const storageKey = (userId: string) => `expense-tracker:cleanup:${userId}`;
const interrupted = "Cleanup has not been confirmed. Retry cleanup to finish clearing your data.";

// Only an acknowledged deletion completes cleanup. Empty visible lists cannot
// prove that hidden records or a previously queued deletion have been processed.
export function createCleanupCoordinator(storage: CleanupStorage, notify: () => void) {
  const states = new Map<string, CleanupStatus>();
  const requests = new Map<string, Promise<void>>();
  function get(userId: string): CleanupStatus | null {
    const existing = states.get(userId);
    if (existing) return existing;
    let pending = false;
    try {
      pending = storage.getItem(storageKey(userId)) !== null;
    } catch {
      /* Memory remains available in restricted browsers. */
    }
    if (!pending) return null;
    const restored = { running: false, error: interrupted };
    states.set(userId, restored);
    return restored;
  }
  function run(userId: string, acknowledgedDeletion: () => Promise<void>): Promise<void> {
    const active = requests.get(userId);
    if (active) return active;
    states.set(userId, { running: true, error: "" });
    try {
      storage.setItem(storageKey(userId), "pending");
    } catch {
      /* The current tab still guards writes. */
    }
    notify();
    const request = Promise.resolve()
      .then(acknowledgedDeletion)
      .then(() => {
        states.delete(userId);
        try {
          storage.removeItem(storageKey(userId));
        } catch {
          /* No persistent state was available. */
        }
        notify();
      })
      .catch((failure: unknown) => {
        states.set(userId, {
          running: false,
          error: `Cleanup has not been confirmed. ${failure instanceof Error ? failure.message : "Please retry cleanup."}`,
        });
        notify();
        throw failure;
      })
      .finally(() => {
        requests.delete(userId);
      });
    requests.set(userId, request);
    return request;
  }
  return { get, run };
}
