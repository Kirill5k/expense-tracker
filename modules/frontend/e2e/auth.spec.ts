import { test, expect } from "./fixtures";

test("anonymous visitors sign in after an actionable credential error", async ({
  page,
  apiMock,
}) => {
  apiMock.authenticated = false;
  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/signin$/);
  await page.getByLabel("Email address", { exact: true }).fill(apiMock.user.email);
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Invalid email or password");
  await expect(page).toHaveURL(/\/signin$/);
  await page.getByLabel("Password", { exact: true }).fill(apiMock.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect(apiMock.authenticated).toBe(true);
});

test("registration displays duplicate-email errors and then signs in a new account", async ({
  page,
  apiMock,
}) => {
  apiMock.authenticated = false;
  await page.goto("/signup");
  await page.getByLabel("First name", { exact: true }).fill("Sam");
  await page.getByLabel("Last name", { exact: true }).fill("Taylor");
  await page.getByLabel("Email address", { exact: true }).fill("existing@example.test");
  await page.getByLabel("Password", { exact: true }).fill("new-password-for-test");
  await page.getByLabel("Default currency", { exact: true }).selectOption("EUR");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("already exists");
  await page.getByLabel("Email address", { exact: true }).fill("sam@example.test");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect(apiMock.user.firstName).toBe("Sam");
  expect(apiMock.user.settings.currency.code).toBe("EUR");
  expect(apiMock.authenticated).toBe(true);
});

test("a failed automatic login after registration can retry without creating the user again", async ({
  page,
  apiMock,
}) => {
  apiMock.authenticated = false;
  apiMock.failures.set("POST auth/login", {
    status: 503,
    message: "Sign-in is temporarily unavailable.",
  });
  await page.goto("/signup");
  await page.getByLabel("First name", { exact: true }).fill("Sam");
  await page.getByLabel("Last name", { exact: true }).fill("Taylor");
  await page.getByLabel("Email address", { exact: true }).fill("sam@example.test");
  await page.getByLabel("Password", { exact: true }).fill("new-password-for-test");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "You’re all set." })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("temporarily unavailable");
  apiMock.failures.delete("POST auth/login");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect(
    apiMock.requests.filter((request) => request.method === "POST" && request.path === "auth/user"),
  ).toHaveLength(1);
});

test("read errors can retry and an expired session returns to sign-in", async ({
  page,
  apiMock,
}) => {
  apiMock.failures.set("GET accounts", "offline");
  await page.goto("/accounts");
  await expect(page.getByRole("heading", { name: "We couldn’t load this just yet" })).toBeVisible();
  apiMock.failures.delete("GET accounts");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Accounts", exact: true })).toBeVisible();
  apiMock.authenticated = false;
  await page.reload();
  await expect(page).toHaveURL(/\/signin$/);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
});

test("session changes clear cached financial data across tabs", async ({
  page,
  context,
  apiMock,
}) => {
  await page.goto("/transactions");
  await expect(page.getByRole("link", { name: /Morning coffee/ })).toBeVisible();
  const otherTab = await context.newPage();
  await otherTab.clock.setFixedTime(new Date("2026-09-15T12:00:00Z"));
  await otherTab.goto("/transactions");
  await expect(otherTab.getByRole("link", { name: /Morning coffee/ })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/signin$/);
  await expect(otherTab).toHaveURL(/\/signin$/);
  await expect(otherTab.getByRole("link", { name: /Morning coffee/ })).toHaveCount(0);

  // Simulate a different account signing in with the same browser session.
  apiMock.user = {
    ...apiMock.user,
    id: "000000000000000000000002",
    firstName: "Sam",
    email: "sam@example.test",
  };
  apiMock.transactions = [];
  apiMock.accounts = [];
  apiMock.categories = [];
  apiMock.recurring = [];
  await otherTab.getByLabel("Email address", { exact: true }).fill(apiMock.user.email);
  await otherTab.getByLabel("Password", { exact: true }).fill(apiMock.password);
  await otherTab.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(otherTab).toHaveURL("/");
  await page.goto("/transactions");
  await expect(page.getByRole("heading", { name: "A fresh start", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Morning coffee/ })).toHaveCount(0);
  await otherTab.close();
});
