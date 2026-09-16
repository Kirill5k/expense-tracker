/** Server-only API boundary. Browser requests never receive the core bearer token. */
export const DEFAULT_CORE_URL = "https://api--expense-tracker-core--j6xvqz9kpswd.code.run";
export const SESSION_COOKIE_NAME = "expense_tracker_session";
export const MAX_REQUEST_BYTES = 64 * 1024;

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface BffDependencies {
  coreUrl?: string;
  fetch?: Fetcher;
  timeoutMs?: number;
  secureCookies?: boolean;
}

interface Endpoint {
  path: RegExp;
  methods: readonly string[];
  public?: boolean;
  json?: boolean;
  action?: "login" | "logout" | "password" | "delete-user";
  query?: readonly string[];
}

const id = "[a-fA-F0-9]{24}";

// This intentionally lists only implemented controller routes used by the web app.
// In particular, periodic transaction detail GET and DELETE are not implemented.
const endpoints: readonly Endpoint[] = [
  { path: /^auth\/login$/, methods: ["POST"], public: true, json: true, action: "login" },
  { path: /^auth\/user$/, methods: ["POST"], public: true, json: true },
  { path: /^auth\/user$/, methods: ["GET"] },
  { path: /^auth\/user$/, methods: ["DELETE"], action: "delete-user" },
  { path: /^auth\/user\/data$/, methods: ["DELETE"] },
  { path: new RegExp(`^auth/user/${id}/settings$`), methods: ["PUT"], json: true },
  {
    path: new RegExp(`^auth/user/${id}/password$`),
    methods: ["POST"],
    json: true,
    action: "password",
  },
  { path: /^auth\/logout$/, methods: ["POST"], action: "logout" },
  { path: /^accounts$/, methods: ["GET"] },
  { path: /^accounts$/, methods: ["POST"], json: true },
  { path: new RegExp(`^accounts/${id}$`), methods: ["PUT"], json: true },
  { path: new RegExp(`^accounts/${id}$`), methods: ["DELETE"] },
  { path: new RegExp(`^accounts/${id}/hidden$`), methods: ["PUT"], json: true },
  { path: /^categories$/, methods: ["GET"] },
  { path: /^categories$/, methods: ["POST"], json: true },
  { path: new RegExp(`^categories/${id}$`), methods: ["GET", "DELETE"] },
  { path: new RegExp(`^categories/${id}$`), methods: ["PUT"], json: true },
  { path: new RegExp(`^categories/${id}/hidden$`), methods: ["PUT"], json: true },
  { path: /^transactions$/, methods: ["GET"], query: ["from", "to"] },
  { path: /^transactions$/, methods: ["POST"], json: true },
  { path: new RegExp(`^transactions/${id}$`), methods: ["GET", "DELETE"] },
  { path: new RegExp(`^transactions/${id}$`), methods: ["PUT"], json: true },
  { path: new RegExp(`^transactions/${id}/hidden$`), methods: ["PUT"], json: true },
  { path: /^periodic-transactions$/, methods: ["GET"] },
  { path: /^periodic-transactions$/, methods: ["POST"], json: true },
  { path: new RegExp(`^periodic-transactions/${id}$`), methods: ["PUT"], json: true },
  { path: new RegExp(`^periodic-transactions/${id}/hidden$`), methods: ["PUT"], json: true },
];

function privateHeaders(): Headers {
  return new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Cookie",
    "X-Content-Type-Options": "nosniff",
  });
}

function errorResponse(status: number, message: string, code: string): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify({ message, code }), { status, headers });
}

function emptyResponse(): Response {
  return new Response(null, { status: 204, headers: privateHeaders() });
}

function cookie(value: string, secure: boolean, clear = false): string {
  return `${SESSION_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}${clear ? "; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT" : ""}`;
}

function clearSession(response: Response, secure: boolean): Response {
  response.headers.set("Set-Cookie", cookie("", secure, true));
  return response;
}

// The core issues JWTs. A strict bounded format also prevents header/cookie injection.
function validToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 3500 &&
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)
  );
}

function sessionToken(request: Request): string | undefined {
  const matches = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
  // Ambiguous duplicate cookies fail closed instead of selecting an attacker-controlled value.
  if (matches.length !== 1) return undefined;
  const value = matches[0].slice(SESSION_COOKIE_NAME.length + 1);
  return validToken(value) ? value : undefined;
}

class RequestFailure extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

async function readBody(request: Request, expectsJson: boolean): Promise<string | undefined> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength))
      throw new RequestFailure(400, "Invalid content length.", "BAD_REQUEST");
    if (Number(contentLength) > MAX_REQUEST_BYTES) {
      throw new RequestFailure(413, "Request body exceeds 64 KB.", "REQUEST_TOO_LARGE");
    }
  }

  if (request.headers.has("content-encoding")) {
    throw new RequestFailure(
      415,
      "Encoded request bodies are not supported.",
      "UNSUPPORTED_MEDIA_TYPE",
    );
  }
  if (
    expectsJson &&
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json"
  ) {
    throw new RequestFailure(415, "Send a JSON request body.", "UNSUPPORTED_MEDIA_TYPE");
  }

  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > MAX_REQUEST_BYTES) {
          void reader.cancel().catch(() => undefined);
          throw new RequestFailure(413, "Request body exceeds 64 KB.", "REQUEST_TOO_LARGE");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }

  if (!expectsJson) {
    if (length !== 0)
      throw new RequestFailure(400, "This endpoint does not accept a request body.", "BAD_REQUEST");
    return undefined;
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const body: unknown = JSON.parse(text);
    if (body === null || typeof body !== "object" || Array.isArray(body))
      throw new Error("Expected object");
    return text;
  } catch {
    throw new RequestFailure(400, "Send a valid JSON object.", "BAD_REQUEST");
  }
}

function upstreamBase(value: string): URL {
  const url = new URL(value);
  if (
    !/^https?:$/.test(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error("EXPENSE_TRACKER_CORE_URL must be an HTTP(S) origin without a path");
  }
  return new URL("/api/", url);
}

function upstreamErrorMessage(text: string): string | undefined {
  try {
    const value: unknown = JSON.parse(text);
    if (
      value &&
      typeof value === "object" &&
      "message" in value &&
      typeof value.message === "string"
    ) {
      return value.message.slice(0, 1000);
    }
  } catch {
    // Do not send upstream HTML, stack traces, or gateway response bodies to the browser.
  }
  return undefined;
}

function requestOrigin(request: Request, url: URL): string | undefined {
  const host = request.headers.get("host");
  if (!host) return url.origin;
  // Next may build Request.url with its internal listening host. Use the actual
  // request Host while deliberately ignoring untrusted X-Forwarded-Host values.
  if (!/^(?:[A-Za-z0-9.-]+|\[[A-Fa-f0-9:]+\])(?::\d+)?$/.test(host)) return undefined;
  try {
    return new URL(`${url.protocol}//${host}`).origin;
  } catch {
    return undefined;
  }
}

export function createBffHandler(dependencies: BffDependencies = {}) {
  const fetcher = dependencies.fetch ?? fetch;
  const secure = dependencies.secureCookies ?? process.env.NODE_ENV === "production";
  const timeoutMs = dependencies.timeoutMs ?? 15_000;

  return async function handleBff(
    request: Request,
    segments: readonly string[],
  ): Promise<Response> {
    const pathname = segments.join("/");
    const url = new URL(request.url);
    if (
      segments.length === 0 ||
      segments.some((segment) => !/^[A-Za-z0-9-]+$/.test(segment)) ||
      url.pathname !== `/api/${pathname}`
    ) {
      return errorResponse(404, "API endpoint not found.", "NOT_FOUND");
    }

    const matchingPaths = endpoints.filter((endpoint) => endpoint.path.test(pathname));
    const endpoint = matchingPaths.find((candidate) => candidate.methods.includes(request.method));
    if (!endpoint) {
      if (!matchingPaths.length) return errorResponse(404, "API endpoint not found.", "NOT_FOUND");
      const response = errorResponse(405, "Method not allowed.", "METHOD_NOT_ALLOWED");
      response.headers.set(
        "Allow",
        [...new Set(matchingPaths.flatMap((entry) => [...entry.methods]))].join(", "),
      );
      return response;
    }

    const seenQueries = new Set<string>();
    for (const [key, value] of url.searchParams) {
      if (!endpoint.query?.includes(key) || seenQueries.has(key) || value.length > 128) {
        return errorResponse(400, "Invalid query parameters.", "BAD_REQUEST");
      }
      seenQueries.add(key);
    }

    if (request.method !== "GET" && request.headers.get("origin") !== requestOrigin(request, url)) {
      return errorResponse(403, "This request must come from this website.", "INVALID_ORIGIN");
    }

    const token = endpoint.public ? undefined : sessionToken(request);
    if (!endpoint.public && !token) {
      if (endpoint.action === "logout") return clearSession(emptyResponse(), secure);
      return clearSession(
        errorResponse(401, "Your session has ended. Please sign in again.", "SESSION_EXPIRED"),
        secure,
      );
    }

    let body: string | undefined;
    try {
      if (request.method !== "GET") body = await readBody(request, endpoint.json ?? false);
    } catch (error) {
      if (error instanceof RequestFailure)
        return errorResponse(error.status, error.message, error.code);
      return errorResponse(400, "The request body could not be read.", "BAD_REQUEST");
    }

    let upstream: URL;
    try {
      upstream = new URL(
        pathname,
        upstreamBase(
          dependencies.coreUrl ?? process.env.EXPENSE_TRACKER_CORE_URL ?? DEFAULT_CORE_URL,
        ),
      );
      upstream.search = url.searchParams.toString();
    } catch {
      const response = errorResponse(
        500,
        "The expense service is not configured correctly.",
        "SERVICE_CONFIGURATION_ERROR",
      );
      return endpoint.action === "logout" ? clearSession(response, secure) : response;
    }

    const controller = new AbortController();
    const onClientAbort = () => controller.abort();
    request.signal.addEventListener("abort", onClientAbort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      if (request.signal.aborted) controller.abort();
      const headers = new Headers({ Accept: "application/json" });
      if (body !== undefined) headers.set("Content-Type", "application/json");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const result = await fetcher(upstream, {
        method: request.method,
        headers,
        body,
        signal: controller.signal,
        cache: "no-store",
        redirect: "manual",
      });

      // Core uses 403 for revoked, expired and invalid sessions. Its 401 password
      // errors are form errors and must not clear an otherwise valid session.
      if (!endpoint.public && result.status === 403) {
        void result.body?.cancel().catch(() => undefined);
        return clearSession(
          errorResponse(401, "Your session has ended. Please sign in again.", "SESSION_EXPIRED"),
          secure,
        );
      }

      const text = await result.text();
      let response: Response;
      if (result.status >= 300 && result.status < 400) {
        response = errorResponse(
          502,
          "The expense service returned an unexpected response.",
          "UPSTREAM_ERROR",
        );
      } else if (result.status >= 500) {
        response = errorResponse(
          502,
          "The expense service is temporarily unavailable. Please try again.",
          "UPSTREAM_ERROR",
        );
      } else if (!result.ok) {
        response = errorResponse(
          result.status,
          upstreamErrorMessage(text) ?? "The request could not be completed.",
          "REQUEST_FAILED",
        );
      } else if (endpoint.action === "login") {
        let login: unknown;
        try {
          login = JSON.parse(text);
        } catch {
          /* handled below */
        }
        if (
          !login ||
          typeof login !== "object" ||
          !("access_token" in login) ||
          !validToken(login.access_token) ||
          !("token_type" in login) ||
          login.token_type !== "Bearer"
        ) {
          return errorResponse(
            502,
            "The expense service returned an invalid sign-in response.",
            "UPSTREAM_ERROR",
          );
        }
        response = emptyResponse();
        response.headers.set("Set-Cookie", cookie(login.access_token, secure));
      } else if (result.status === 204) {
        response = emptyResponse();
      } else {
        try {
          JSON.parse(text);
          const responseHeaders = privateHeaders();
          responseHeaders.set("Content-Type", "application/json; charset=utf-8");
          response = new Response(text, { status: result.status, headers: responseHeaders });
        } catch {
          response = errorResponse(
            502,
            "The expense service returned an unexpected response.",
            "UPSTREAM_ERROR",
          );
        }
      }

      if (
        endpoint.action === "logout" ||
        (result.ok && (endpoint.action === "password" || endpoint.action === "delete-user"))
      ) {
        clearSession(response, secure);
      }
      return response;
    } catch {
      const response = timedOut
        ? errorResponse(
            504,
            "The expense service took too long to respond. Please try again.",
            "UPSTREAM_TIMEOUT",
          )
        : request.signal.aborted
          ? errorResponse(499, "The request was cancelled.", "REQUEST_CANCELLED")
          : errorResponse(
              502,
              "The expense service could not be reached. Please try again.",
              "UPSTREAM_UNAVAILABLE",
            );
      return endpoint.action === "logout" ? clearSession(response, secure) : response;
    } finally {
      clearTimeout(timer);
      request.signal.removeEventListener("abort", onClientAbort);
    }
  };
}
