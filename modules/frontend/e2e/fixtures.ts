import { test as base, expect, type Route } from "@playwright/test";
import type { Account } from "../src/features/accounts/types";
import type { Category } from "../src/features/categories/types";
import type { User } from "../src/features/auth/types";
import type { Transaction } from "../src/features/transactions/types";
import type { Recurring } from "../src/features/recurring/types";

export const ids = {
  user: "000000000000000000000001",
  everyday: "000000000000000000000010",
  travel: "000000000000000000000011",
  food: "000000000000000000000020",
  salary: "000000000000000000000021",
  transport: "000000000000000000000022",
  bills: "000000000000000000000023",
  coffee: "000000000000000000000030",
  euro: "000000000000000000000033",
  recurring: "000000000000000000000040",
};
const gbp = { code: "GBP", symbol: "£" },
  eur = { code: "EUR", symbol: "€" };
type Visible<T> = T & { hidden?: boolean };
type Failure = { status: number; message: string; code?: string } | "offline";
type RecordedRequest = { method: string; path: string; body?: Record<string, unknown> };

export class MockApi {
  authenticated = true;
  password = "correct-password";
  user: User = {
    id: ids.user,
    firstName: "Alex",
    lastName: "Morgan",
    email: "alex@example.test",
    registrationDate: "2025-01-12T12:00:00Z",
    totalTransactionCount: 8,
    settings: {
      currency: gbp,
      darkMode: false,
      hideFutureTransactions: true,
      futureTransactionVisibilityDays: 0,
    },
  };
  accounts: Visible<Account>[] = [
    { id: ids.everyday, name: "Everyday", currency: gbp, isMain: true },
    { id: ids.travel, name: "Travel", currency: eur, isMain: false },
  ];
  categories: Visible<Category>[] = [
    { id: ids.food, name: "Food & drink", kind: "expense", color: "#FB923C", icon: "mdi-food" },
    { id: ids.salary, name: "Salary", kind: "income", color: "#34D399", icon: "mdi-cash" },
    { id: ids.transport, name: "Transport", kind: "expense", color: "#60A5FA", icon: "mdi-train" },
    {
      id: ids.bills,
      name: "Bills & subscriptions",
      kind: "expense",
      color: "#A78BFA",
      icon: "mdi-home",
    },
  ];
  transactions: Visible<Transaction>[] = [
    {
      id: ids.coffee,
      accountId: ids.everyday,
      categoryId: ids.food,
      date: "2026-09-15",
      amount: { value: 4.5, currency: gbp },
      note: "Morning coffee",
      tags: ["daily"],
      parentTransactionId: null,
      isRecurring: false,
    },
    {
      id: "000000000000000000000031",
      accountId: ids.everyday,
      categoryId: ids.food,
      date: "2026-09-14",
      amount: { value: 42.8, currency: gbp },
      note: "Weekly groceries",
      tags: ["essentials"],
      parentTransactionId: null,
      isRecurring: false,
    },
    {
      id: "000000000000000000000032",
      accountId: ids.everyday,
      categoryId: ids.salary,
      date: "2026-09-01",
      amount: { value: 3250, currency: gbp },
      note: "September salary",
      tags: [],
      parentTransactionId: null,
      isRecurring: false,
    },
    {
      id: ids.euro,
      accountId: ids.travel,
      categoryId: ids.bills,
      date: "2026-09-10",
      amount: { value: 89.95, currency: eur },
      note: "Berlin stay",
      tags: ["work", "travel"],
      parentTransactionId: ids.recurring,
      isRecurring: true,
    },
    {
      id: "000000000000000000000034",
      accountId: ids.everyday,
      categoryId: ids.transport,
      date: "2026-09-12",
      amount: { value: 28.4, currency: gbp },
      note: "Train to Brighton",
      tags: ["weekend"],
      parentTransactionId: null,
      isRecurring: false,
    },
    {
      id: "000000000000000000000035",
      accountId: ids.everyday,
      categoryId: ids.bills,
      date: "2026-09-03",
      amount: { value: 1200, currency: gbp },
      note: "September rent",
      tags: ["home"],
      parentTransactionId: ids.recurring,
      isRecurring: true,
    },
    {
      id: "000000000000000000000036",
      accountId: null,
      categoryId: ids.food,
      date: "2026-08-21",
      amount: { value: 35, currency: gbp },
      note: "August lunch",
      tags: [],
      parentTransactionId: null,
      isRecurring: false,
    },
    {
      id: "000000000000000000000037",
      accountId: ids.everyday,
      categoryId: ids.bills,
      date: "2026-09-20",
      amount: { value: 12.99, currency: gbp },
      note: "Upcoming subscription",
      tags: [],
      parentTransactionId: ids.recurring,
      isRecurring: true,
    },
  ];
  recurring: Visible<Recurring>[] = [
    {
      id: ids.recurring,
      accountId: ids.everyday,
      categoryId: ids.bills,
      amount: { value: 12.99, currency: gbp },
      note: "Music subscription",
      tags: ["monthly"],
      recurrence: {
        startDate: "2026-08-20",
        nextDate: "2026-09-20",
        endDate: null,
        interval: 1,
        frequency: "monthly",
      },
    },
  ];
  requests: RecordedRequest[] = [];
  unhandled: string[] = [];
  failures = new Map<string, Failure>();
  failureQueue = new Map<string, (Failure | null)[]>();
  private sequence = 100;
  private nextId() {
    return String(this.sequence++).padStart(24, "0");
  }
  private category<T extends { categoryId: string }>(record: T) {
    return {
      ...record,
      category: this.categories.find((item) => item.id === record.categoryId) ?? null,
    };
  }

  async handle(route: Route) {
    const request = route.request(),
      url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\//, ""),
      method = request.method();
    const body: Record<string, unknown> = request.postData() ? request.postDataJSON() : {};
    // Never record authentication payloads, even though these credentials are synthetic.
    this.requests.push({ method, path, ...(path.startsWith("auth/") ? {} : { body }) });
    const respond = (value: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(value),
        headers: { "Cache-Control": "private, no-store" },
      });
    const empty = () =>
      route.fulfill({ status: 204, body: "", headers: { "Cache-Control": "private, no-store" } });
    const failure =
      this.failureQueue.get(`${method} ${path}`)?.shift() ?? this.failures.get(`${method} ${path}`);
    if (failure === "offline") return route.abort("failed");
    if (failure)
      return respond(
        { message: failure.message, code: failure.code ?? "REQUEST_FAILED" },
        failure.status,
      );

    if (path === "auth/login" && method === "POST") {
      if (body.email !== this.user.email || body.password !== this.password)
        return respond({ message: "Invalid email or password", code: "REQUEST_FAILED" }, 401);
      this.authenticated = true;
      return empty();
    }
    if (path === "auth/user" && method === "POST") {
      if (body.email === this.user.email || body.email === "existing@example.test")
        return respond(
          { message: "An account with this email already exists", code: "REQUEST_FAILED" },
          409,
        );
      this.user = {
        ...this.user,
        email: String(body.email),
        firstName: String(body.firstName),
        lastName: String(body.lastName),
        settings: {
          ...this.user.settings,
          currency: body.currency as User["settings"]["currency"],
        },
      };
      this.password = String(body.password);
      return respond({ id: this.user.id }, 201);
    }
    if (!this.authenticated)
      return respond(
        { message: "Your session has ended. Please sign in again.", code: "SESSION_EXPIRED" },
        401,
      );
    if (path === "auth/user" && method === "GET") return respond(this.user);
    if (
      (path === "auth/logout" && method === "POST") ||
      (path === "auth/user" && method === "DELETE")
    ) {
      this.authenticated = false;
      return empty();
    }
    if (path === `auth/user/${this.user.id}/password` && method === "POST") {
      if (body.currentPassword !== this.password)
        return respond(
          { message: "Entered password appears to be incorrect", code: "REQUEST_FAILED" },
          401,
        );
      this.password = String(body.newPassword);
      this.authenticated = false;
      return empty();
    }
    if (path === `auth/user/${this.user.id}/settings` && method === "PUT") {
      this.user.settings = body as User["settings"];
      return empty();
    }
    if (path === "auth/user/data" && method === "DELETE") {
      this.accounts = [];
      this.categories = [];
      this.transactions = [];
      this.recurring = [];
      return empty();
    }

    const [domain, id, action] = path.split("/");
    if (domain === "accounts" || domain === "categories") {
      const collection = domain === "accounts" ? this.accounts : this.categories;
      if (!id && method === "GET") return respond(collection.filter((item) => !item.hidden));
      if (!id && method === "POST") {
        const entry = { ...body, id: this.nextId() } as Account & Category;
        collection.push(entry);
        return respond(entry, 201);
      }
      const entry = collection.find((item) => item.id === id);
      if (entry && method === "GET" && domain === "categories") return respond(entry);
      if (entry && action === "hidden" && method === "PUT") {
        entry.hidden = Boolean(body.hidden);
        const key = domain === "accounts" ? "accountId" : "categoryId";
        for (const transaction of this.transactions)
          if (transaction[key] === id) transaction.hidden = entry.hidden;
        for (const recurring of this.recurring)
          if (recurring[key] === id) recurring.hidden = entry.hidden;
        return empty();
      }
      if (entry && !action && method === "PUT") {
        Object.assign(entry, body);
        return empty();
      }
    }
    if (domain === "transactions") {
      if (!id && method === "GET") {
        const from = url.searchParams.get("from")?.slice(0, 10),
          to = url.searchParams.get("to")?.slice(0, 10);
        return respond(
          this.transactions
            .filter(
              (item) => !item.hidden && (!from || item.date >= from) && (!to || item.date <= to),
            )
            .map((item) => this.category(item)),
        );
      }
      if (!id && method === "POST") {
        const entry = {
          ...body,
          id: this.nextId(),
          parentTransactionId: null,
          isRecurring: false,
        } as Transaction;
        this.transactions.push(entry);
        return respond(this.category(entry), 201);
      }
      const entry = this.transactions.find((item) => item.id === id);
      if (entry && method === "GET") return respond(this.category(entry));
      if (entry && action === "hidden" && method === "PUT") {
        entry.hidden = Boolean(body.hidden);
        return empty();
      }
      if (entry && method === "PUT") {
        Object.assign(entry, body);
        return empty();
      }
      if (entry && method === "DELETE") {
        this.transactions = this.transactions.filter((item) => item !== entry);
        return empty();
      }
    }
    if (domain === "periodic-transactions") {
      if (!id && method === "GET")
        return respond(
          this.recurring.filter((item) => !item.hidden).map((item) => this.category(item)),
        );
      if (!id && method === "POST") {
        const entry = { ...body, id: this.nextId() } as Recurring;
        this.recurring.push(entry);
        return respond(this.category(entry), 201);
      }
      const entry = this.recurring.find((item) => item.id === id);
      if (entry && action === "hidden" && method === "PUT") {
        entry.hidden = Boolean(body.hidden);
        return empty();
      }
      if (entry && method === "PUT") {
        Object.assign(entry, body);
        return empty();
      }
    }
    this.unhandled.push(`${method} ${path}`);
    return respond({ message: "Unmocked API request blocked", code: "TEST_ROUTE_MISSING" }, 501);
  }
}

export const test = base.extend<{ apiMock: MockApi }>({
  apiMock: [
    async ({ page, context, baseURL }, use) => {
      const mock = new MockApi();
      const allowedOrigin = new URL(baseURL!).origin;
      await page.clock.setFixedTime(new Date("2026-09-15T12:00:00Z"));
      // Also mock API calls from other tabs and block accidental remote origins.
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (url.origin !== allowedOrigin) return route.abort("blockedbyclient");
        if (url.pathname.startsWith("/api/")) return mock.handle(route);
        return route.continue();
      });
      await page.route("**/api/**", (route) => mock.handle(route));
      await use(mock);
      expect(
        mock.unhandled,
        "Every API call must have a fixture; no request may reach the live backend",
      ).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
