export const SESSION_CHANGE_KEY = "expense-tracker:session-change";
export function announceSessionChange() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_CHANGE_KEY, crypto.randomUUID());
  } catch {
    /* Private storage may be unavailable; this tab still clears its own cache. */
  }
}
