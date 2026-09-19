import { announceSessionChange } from "./session";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

interface ApiOptions extends RequestInit {
  // An anonymous session check on the auth page must not sign out other tabs.
  notifySessionExpiry?: boolean;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { notifySessionExpiry = true, ...requestOptions } = options;
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      ...requestOptions,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      signal: options.signal ?? AbortSignal.timeout(65000),
    });
  } catch {
    throw new ApiError(
      "We couldn’t reach the server. Your changes have not been confirmed. Check your connection and try again.",
      0,
    );
  }
  if (options.signal?.aborted) throw new DOMException("The request was cancelled.", "AbortError");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (options.signal?.aborted) throw new DOMException("The request was cancelled.", "AbortError");
    const error = new ApiError(
      body.message ?? "Something went wrong. Please try again.",
      response.status,
      body.code,
    );
    if (notifySessionExpiry && error.code === "SESSION_EXPIRED" && typeof window !== "undefined")
      window.dispatchEvent(new Event("session-expired"));
    throw error;
  }
  if (
    (options.method === "POST" &&
      (path === "auth/login" ||
        path === "auth/logout" ||
        /^auth\/user\/[^/]+\/password$/.test(path))) ||
    (options.method === "DELETE" && path === "auth/user")
  )
    announceSessionChange();
  return response.status === 204 ? (undefined as T) : response.json();
}

export const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";
