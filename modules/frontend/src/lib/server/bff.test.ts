import { afterEach, describe, expect, it, vi } from "vitest";
import { createBffHandler, DEFAULT_CORE_URL, MAX_REQUEST_BYTES, SESSION_COOKIE_NAME } from "./bff";
import { GET as health } from "../../app/health/route";

const origin = "https://tracker.example";
const coreOrigin = "https://core.example.test";
const objectId = "507f1f77bcf86cd799439011";
const token = "header.payload.signature";

afterEach(() => vi.unstubAllEnvs());

function request(path: string, options: RequestInit = {}): Request {
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers);
  headers.set("Cookie", headers.get("Cookie") ?? `${SESSION_COOKIE_NAME}=${token}`);
  if (method !== "GET" && !headers.has("Origin")) headers.set("Origin", origin);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return new Request(`${origin}/api/${path}`, { ...options, method, headers });
}

function jsonResponse(value: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(value, { status, headers });
}

function setup(
  result: Response = jsonResponse([]),
  options: { secureCookies?: boolean; coreUrl?: string } = {},
) {
  const fetcher = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(
    async () => result,
  );
  const handle = createBffHandler({
    fetch: fetcher,
    coreUrl: coreOrigin,
    secureCookies: false,
    ...options,
  });
  return { handle, fetcher };
}

function expectPrivate(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
  expect(response.headers.get("Vary")).toBe("Cookie");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
}

describe("upstream configuration", () => {
  it("uses an explicit origin ahead of the environment", async () => {
    vi.stubEnv("EXPENSE_TRACKER_CORE_URL", "http://127.0.0.1:9");
    const { handle, fetcher } = setup();
    const response = await handle(request("accounts"), ["accounts"]);
    expect(response.status).toBe(200);
    expect(String(fetcher.mock.calls[0][0])).toBe(`${coreOrigin}/api/accounts`);
  });

  it("uses the environment when no explicit origin is supplied", async () => {
    vi.stubEnv("EXPENSE_TRACKER_CORE_URL", "http://127.0.0.1:9");
    const { handle, fetcher } = setup(jsonResponse([]), { coreUrl: undefined });
    const response = await handle(request("accounts"), ["accounts"]);
    expect(response.status).toBe(200);
    expect(String(fetcher.mock.calls[0][0])).toBe("http://127.0.0.1:9/api/accounts");
  });

  it("uses the hosted default only when neither origin is configured", async () => {
    vi.stubEnv("EXPENSE_TRACKER_CORE_URL", undefined);
    const { handle, fetcher } = setup(jsonResponse([]), { coreUrl: undefined });
    const response = await handle(request("accounts"), ["accounts"]);
    expect(response.status).toBe(200);
    expect(String(fetcher.mock.calls[0][0])).toBe(`${DEFAULT_CORE_URL}/api/accounts`);
  });

  it("rejects an invalid environment origin without fetching", async () => {
    vi.stubEnv("EXPENSE_TRACKER_CORE_URL", "https://core.example.test/api");
    const { handle, fetcher } = setup(jsonResponse([]), { coreUrl: undefined });
    const response = await handle(request("accounts"), ["accounts"]);
    expect(response.status).toBe(500);
    expect((await response.json()).code).toBe("SERVICE_CONFIGURATION_ERROR");
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("browser session boundary", () => {
  it("exchanges login credentials for an HttpOnly session cookie and returns no token body", async () => {
    const { handle, fetcher } = setup(jsonResponse({ access_token: token, token_type: "Bearer" }), {
      secureCookies: true,
    });
    const body = JSON.stringify({ email: "person@example.com", password: "some password" });
    const response = await handle(request("auth/login", { method: "POST", body }), [
      "auth",
      "login",
    ]);

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("Set-Cookie")).toBe(
      `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure`,
    );
    expect(response.headers.get("Set-Cookie")).not.toMatch(/Max-Age|Expires|Domain/);
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe(`${coreOrigin}/api/auth/login`);
    expect(init?.body).toBe(body);
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
    expectPrivate(response);
  });

  it("omits Secure for local HTTP development", async () => {
    const { handle } = setup(jsonResponse({ access_token: token, token_type: "Bearer" }));
    const response = await handle(request("auth/login", { method: "POST", body: "{}" }), [
      "auth",
      "login",
    ]);
    expect(response.headers.get("Set-Cookie")).not.toContain("Secure");
  });

  it.each([
    { access_token: "bad; Path=/", token_type: "Bearer" },
    { access_token: token, token_type: "Other" },
    { access_token: "x".repeat(3600), token_type: "Bearer" },
    {},
  ])("never exposes malformed login responses: %j", async (login) => {
    const { handle } = setup(jsonResponse(login));
    const response = await handle(request("auth/login", { method: "POST", body: "{}" }), [
      "auth",
      "login",
    ]);
    expect(response.status).toBe(502);
    expect(response.headers.has("Set-Cookie")).toBe(false);
    expect(await response.text()).not.toContain("access_token");
  });

  it("preserves bad-credential 401 as a form error without clearing an existing session", async () => {
    const { handle } = setup(jsonResponse({ message: "Invalid email or password" }, 401));
    const response = await handle(request("auth/login", { method: "POST", body: "{}" }), [
      "auth",
      "login",
    ]);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      message: "Invalid email or password",
      code: "REQUEST_FAILED",
    });
    expect(response.headers.has("Set-Cookie")).toBe(false);
  });

  it("forwards registration DTOs and the created id without establishing a session", async () => {
    const { handle, fetcher } = setup(jsonResponse({ id: objectId }, 201));
    const body = JSON.stringify({
      email: "person@example.com",
      firstName: "Test",
      lastName: "Person",
      password: "password",
      currency: "GBP",
    });
    const response = await handle(request("auth/user", { method: "POST", body }), ["auth", "user"]);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: objectId });
    expect(response.headers.has("Set-Cookie")).toBe(false);
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).has("Authorization")).toBe(false);
  });

  it("sends only the cookie token and explicit API headers upstream", async () => {
    const { handle, fetcher } = setup(jsonResponse({ id: objectId }), {
      coreUrl: "http://localhost:6000/",
    });
    const response = await handle(
      request("auth/user", {
        headers: {
          Authorization: "Bearer attacker",
          "X-Forwarded-Host": "attacker.example",
          "X-Api-Key": "do-not-forward",
          Cookie: `${SESSION_COOKIE_NAME}=${token}; unrelated=private`,
        },
      }),
      ["auth", "user"],
    );
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe("http://localhost:6000/api/auth/user");
    expect(Object.fromEntries(new Headers(init?.headers))).toEqual({
      accept: "application/json",
      authorization: `Bearer ${token}`,
    });
    expect(init?.cache).toBe("no-store");
    expect(init?.redirect).toBe("manual");
    expect(await response.json()).toEqual({ id: objectId });
    expectPrivate(response);
  });

  it.each([
    "",
    "unrelated=present",
    `${SESSION_COOKIE_NAME}=invalid`,
    `${SESSION_COOKIE_NAME}=${token}; ${SESSION_COOKIE_NAME}=${token}`,
  ])("rejects missing, malformed, or ambiguous cookies (%s)", async (cookie) => {
    const { handle, fetcher } = setup();
    const response = await handle(
      request("accounts", { headers: { Cookie: cookie, Authorization: `Bearer ${token}` } }),
      ["accounts"],
    );
    expect(response.status).toBe(401);
    expect((await response.json()).code).toBe("SESSION_EXPIRED");
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
    expect(fetcher).not.toHaveBeenCalled();
    expectPrivate(response);
  });

  it("normalizes protected backend 403 responses and clears the session", async () => {
    const { handle } = setup(jsonResponse({ message: "Session has expired" }, 403), {
      secureCookies: true,
    });
    const response = await handle(request("transactions"), ["transactions"]);
    expect(response.status).toBe(401);
    expect((await response.json()).code).toBe("SESSION_EXPIRED");
    expect(response.headers.get("Set-Cookie")).toContain(
      "HttpOnly; SameSite=Lax; Secure; Max-Age=0",
    );
  });

  it("keeps the cookie when the current password is wrong", async () => {
    const { handle } = setup(
      jsonResponse({ message: "Entered password appears to be incorrect" }, 401),
    );
    const path = `auth/user/${objectId}/password`;
    const response = await handle(request(path, { method: "POST", body: "{}" }), path.split("/"));
    expect(response.status).toBe(401);
    expect((await response.json()).code).toBe("REQUEST_FAILED");
    expect(response.headers.has("Set-Cookie")).toBe(false);
  });

  it.each([
    ["POST", "auth/logout", undefined],
    ["POST", `auth/user/${objectId}/password`, "{}"],
    ["DELETE", "auth/user", undefined],
  ])("clears the cookie after successful %s %s", async (method, path, body) => {
    const { handle, fetcher } = setup(new Response(null, { status: 204 }));
    const response = await handle(request(path!, { method, body }), path!.split("/"));
    expect(response.status).toBe(204);
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("retains the session after deleting transaction data", async () => {
    const { handle } = setup(new Response(null, { status: 204 }));
    const response = await handle(request("auth/user/data", { method: "DELETE" }), [
      "auth",
      "user",
      "data",
    ]);
    expect(response.status).toBe(204);
    expect(response.headers.has("Set-Cookie")).toBe(false);
  });

  it("makes logout idempotent when the cookie is already absent", async () => {
    const { handle, fetcher } = setup();
    const response = await handle(
      request("auth/logout", { method: "POST", headers: { Cookie: "" } }),
      ["auth", "logout"],
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("allowlisted forwarding", () => {
  it.each([
    ["GET", "accounts", undefined],
    ["POST", "accounts", "{}"],
    ["PUT", `accounts/${objectId}`, "{}"],
    ["DELETE", `accounts/${objectId}`, undefined],
    ["PUT", `accounts/${objectId}/hidden`, "{}"],
    ["GET", "categories", undefined],
    ["POST", "categories", "{}"],
    ["GET", `categories/${objectId}`, undefined],
    ["PUT", `categories/${objectId}`, "{}"],
    ["DELETE", `categories/${objectId}`, undefined],
    ["PUT", `categories/${objectId}/hidden`, "{}"],
    ["GET", "transactions", undefined],
    ["POST", "transactions", "{}"],
    ["GET", `transactions/${objectId}`, undefined],
    ["PUT", `transactions/${objectId}`, "{}"],
    ["DELETE", `transactions/${objectId}`, undefined],
    ["PUT", `transactions/${objectId}/hidden`, "{}"],
    ["GET", "periodic-transactions", undefined],
    ["POST", "periodic-transactions", "{}"],
    ["PUT", `periodic-transactions/${objectId}`, "{}"],
    ["PUT", `periodic-transactions/${objectId}/hidden`, "{}"],
    ["PUT", `auth/user/${objectId}/settings`, "{}"],
  ])("supports implemented %s /%s", async (method, path, body) => {
    const { handle, fetcher } = setup(new Response(null, { status: 204 }));
    const response = await handle(request(path!, { method, body }), path!.split("/"));
    expect(response.status).toBe(204);
    expect(String(fetcher.mock.calls[0][0])).toBe(`${coreOrigin}/api/${path}`);
    expect(fetcher.mock.calls[0][1]?.method).toBe(method);
  });

  it.each([
    ["GET", "sync/watermelon", 404],
    ["GET", "health/status", 404],
    ["GET", "https://other.example", 404],
    ["GET", "transactions/not-an-object-id", 404],
    ["GET", `accounts/${objectId}`, 405],
    ["GET", `periodic-transactions/${objectId}`, 405],
    ["DELETE", `periodic-transactions/${objectId}`, 405],
    ["PATCH", "transactions", 405],
    ["OPTIONS", "transactions", 405],
    ["GET", "auth/login", 405],
  ])("blocks unsupported %s /%s", async (method, path, expectedStatus) => {
    const { handle, fetcher } = setup();
    const response = await handle(request(path, { method }), path.split("/"));
    expect(response.status).toBe(expectedStatus);
    expect(fetcher).not.toHaveBeenCalled();
    expectPrivate(response);
  });

  it.each([
    ["transactions", ["transactions", "..", "auth", "user"]],
    ["transactions%2fauth", ["transactions/auth"]],
    ["%74ransactions", ["transactions"]],
    ["transactions", ["transactions%252f.."]],
    ["categories", ["transactions"]],
  ])("rejects encoded, traversing, and mismatched paths (%s)", async (path, segments) => {
    const { handle, fetcher } = setup();
    const response = await handle(request(path as string), segments as string[]);
    expect(response.status).toBe(404);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("forwards the controller's date range query without changing the target origin", async () => {
    const { handle, fetcher } = setup();
    const query = "from=2026-09-01T00%3A00%3A00.000Z&to=2026-09-30T23%3A59%3A59.999Z";
    const response = await handle(request(`transactions?${query}`), ["transactions"]);
    expect(response.status).toBe(200);
    expect(String(fetcher.mock.calls[0][0])).toBe(`${coreOrigin}/api/transactions?${query}`);
  });

  it.each([
    "transactions?target=https://attacker.example",
    "transactions?from=one&from=two",
    "accounts?from=2026-01-01",
    `transactions?from=${"x".repeat(129)}`,
  ])("rejects unsupported or ambiguous queries (%s)", async (path) => {
    const { handle, fetcher } = setup();
    const response = await handle(request(path), [path.split("?")[0]]);
    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    "https://core.example/api",
    "https://user:password@core.example",
    "file:///etc/passwd",
    "https://core.example/?target=other",
    "not a url",
  ])("rejects an invalid server origin (%s)", async (coreUrl) => {
    const { handle, fetcher } = setup(jsonResponse([]), { coreUrl });
    const response = await handle(request("accounts"), ["accounts"]);
    expect(response.status).toBe(500);
    expect(fetcher).not.toHaveBeenCalled();
    expect(await response.text()).not.toContain(coreUrl);
  });
});

describe("mutation and body protections", () => {
  it("checks the browser-facing Host when Next uses an internal listening URL", async () => {
    const { handle, fetcher } = setup();
    const req = new Request("https://localhost:3000/api/transactions", {
      method: "POST",
      body: "{}",
      headers: {
        Host: "tracker.example",
        Origin: origin,
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });
    const response = await handle(req, ["transactions"]);
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("does not trust a forwarded host to allow a cross-origin mutation", async () => {
    const { handle, fetcher } = setup();
    const response = await handle(
      request("transactions", {
        method: "POST",
        body: "{}",
        headers: {
          Host: "tracker.example",
          Origin: "https://attacker.example",
          "X-Forwarded-Host": "attacker.example",
        },
      }),
      ["transactions"],
    );
    expect(response.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    "tracker.example/path",
    "user@tracker.example",
    "tracker.example,attacker.example",
    "tracker.example:invalid",
  ])("rejects malformed Host values (%s)", async (host) => {
    const { handle, fetcher } = setup();
    const response = await handle(
      request("transactions", { method: "POST", body: "{}", headers: { Host: host } }),
      ["transactions"],
    );
    expect(response.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each(["https://attacker.example", "null", "https://tracker.example.evil", ""])(
    "blocks unsafe mutation origin (%s)",
    async (unsafeOrigin) => {
      const { handle, fetcher } = setup();
      const req = request("transactions", {
        method: "POST",
        body: "{}",
        headers: { Origin: unsafeOrigin },
      });
      const response = await handle(req, ["transactions"]);
      expect(response.status).toBe(403);
      expect((await response.json()).code).toBe("INVALID_ORIGIN");
      expect(fetcher).not.toHaveBeenCalled();
      expect(response.headers.has("Set-Cookie")).toBe(false);
    },
  );

  it.each(["auth/login", "auth/user", "auth/logout"])(
    "requires Origin even for %s",
    async (path) => {
      const { handle, fetcher } = setup();
      const req = request(path, {
        method: "POST",
        body: path === "auth/logout" ? undefined : "{}",
      });
      req.headers.delete("Origin");
      const response = await handle(req, path.split("/"));
      expect(response.status).toBe(403);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it.each(["text/plain", "application/x-www-form-urlencoded"])(
    "rejects simple-request body type %s",
    async (contentType) => {
      const { handle, fetcher } = setup();
      const response = await handle(
        request("auth/login", {
          method: "POST",
          body: "{}",
          headers: { "Content-Type": contentType },
        }),
        ["auth", "login"],
      );
      expect(response.status).toBe(415);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it.each(["", "not json", "[]", "null", "true"])("rejects non-object JSON (%s)", async (body) => {
    const { handle, fetcher } = setup();
    const response = await handle(
      request("transactions", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      }),
      ["transactions"],
    );
    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("enforces the body cap from Content-Length before reading or forwarding", async () => {
    const { handle, fetcher } = setup();
    const response = await handle(
      request("transactions", {
        method: "POST",
        body: "{}",
        headers: { "Content-Length": String(MAX_REQUEST_BYTES + 1) },
      }),
      ["transactions"],
    );
    expect(response.status).toBe(413);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("enforces the byte cap even without Content-Length and for multi-byte text", async () => {
    const { handle, fetcher } = setup();
    const response = await handle(
      request("transactions", {
        method: "POST",
        body: JSON.stringify({ note: "£".repeat(MAX_REQUEST_BYTES / 2) }),
      }),
      ["transactions"],
    );
    expect(response.status).toBe(413);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("accepts an exactly 64 KB JSON body", async () => {
    const { handle, fetcher } = setup();
    const body = JSON.stringify({ note: "x".repeat(MAX_REQUEST_BYTES - 11) });
    expect(new TextEncoder().encode(body)).toHaveLength(MAX_REQUEST_BYTES);
    const response = await handle(request("transactions", { method: "POST", body }), [
      "transactions",
    ]);
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects compressed bodies and unexpected DELETE payloads", async () => {
    const { handle, fetcher } = setup();
    const compressed = await handle(
      request("transactions", {
        method: "POST",
        body: "{}",
        headers: { "Content-Encoding": "gzip" },
      }),
      ["transactions"],
    );
    const deletePayload = await handle(request("auth/user", { method: "DELETE", body: "{}" }), [
      "auth",
      "user",
    ]);
    expect(compressed.status).toBe(415);
    expect(deletePayload.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("controlled upstream failures", () => {
  it("does not forward upstream cookies, cache headers, or redirects", async () => {
    const { handle } = setup(
      jsonResponse([], 200, {
        "Set-Cookie": "secret=never",
        "Cache-Control": "public",
        "X-Internal": "secret",
      }),
    );
    const response = await handle(request("transactions"), ["transactions"]);
    expect(response.headers.has("Set-Cookie")).toBe(false);
    expect(response.headers.has("X-Internal")).toBe(false);
    expectPrivate(response);

    const redirect = setup(
      new Response(null, { status: 302, headers: { Location: "https://attacker.example" } }),
    );
    const redirectResponse = await redirect.handle(request("transactions"), ["transactions"]);
    expect(redirectResponse.status).toBe(502);
    expect(redirectResponse.headers.has("Location")).toBe(false);
    expect(redirect.fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([200, 500, 502, 422])(
    "does not expose upstream HTML or internal error bodies (%s)",
    async (status) => {
      const { handle } = setup(new Response("<html>database connection secret</html>", { status }));
      const response = await handle(request("transactions"), ["transactions"]);
      expect(response.status).toBe(status === 422 ? 422 : 502);
      expect(await response.text()).not.toContain("database connection secret");
      expectPrivate(response);
    },
  );

  it("preserves actionable backend validation errors", async () => {
    const { handle } = setup(jsonResponse({ message: "end date must be after start date" }, 422));
    const response = await handle(
      request("periodic-transactions", { method: "POST", body: "{}" }),
      ["periodic-transactions"],
    );
    expect(response.status).toBe(422);
    expect((await response.json()).message).toBe("end date must be after start date");
  });

  it("returns a controlled network error without retrying a write", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("private network details");
    });
    const handle = createBffHandler({ fetch: fetcher, coreUrl: coreOrigin });
    const response = await handle(request("transactions", { method: "POST", body: "{}" }), [
      "transactions",
    ]);
    expect(response.status).toBe(502);
    expect((await response.json()).code).toBe("UPSTREAM_UNAVAILABLE");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("times out the core request and reports a controlled 504", async () => {
    const fetcher = vi.fn(
      (_input: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("Aborted")), {
            once: true,
          });
        }),
    );
    const handle = createBffHandler({ fetch: fetcher, coreUrl: coreOrigin, timeoutMs: 5 });
    const response = await handle(request("transactions"), ["transactions"]);
    expect(response.status).toBe(504);
    expect((await response.json()).code).toBe("UPSTREAM_TIMEOUT");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("clears the local cookie even if backend logout fails", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("Offline");
    });
    const handle = createBffHandler({ fetch: fetcher, coreUrl: coreOrigin, secureCookies: false });
    const response = await handle(request("auth/logout", { method: "POST" }), ["auth", "logout"]);
    expect(response.status).toBe(502);
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns process health without calling the expense backend", async () => {
    const response = health();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
