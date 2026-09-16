import { test, expect, ids } from "./fixtures";
import { chooseCategory, expectAmountCurrency } from "./form-helpers";

test("overview navigation supports single transaction creation, editing, and archive undo", async ({
  page,
  apiMock,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Transactions", exact: true })
    .click();
  await page.getByRole("link", { name: "Add transaction", exact: true }).click();
  await page.getByLabel("Amount", { exact: true }).fill("12.50");
  await chooseCategory(page, "Food & drink");
  await page.getByLabel("Note", { exact: true }).fill("Lunch with friends");
  await page.getByLabel("Tags", { exact: true }).fill("social, lunch");
  await page.getByRole("button", { name: "Add transaction", exact: true }).click();
  await expect(page).toHaveURL(/\/transactions\?currency=GBP$/);
  await expect(page.getByRole("link", { name: /Lunch with friends/ })).toHaveCount(1);
  const created = apiMock.transactions.filter((item) => item.note === "Lunch with friends");
  expect(created.map((item) => item.amount.value)).toEqual([12.5]);
  expect(created[0].tags).toEqual(["social", "lunch"]);
  expect(
    created.every((item) => item.accountId === ids.everyday && item.date === "2026-09-15"),
  ).toBe(true);
  await page
    .getByRole("link", { name: /Lunch with friends/ })
    .first()
    .click();
  await page.getByLabel("Note", { exact: true }).fill("Lunch at the market");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("link", { name: /Lunch at the market/ })).toBeVisible();
  await page.getByRole("button", { name: "Actions for Lunch at the market", exact: true }).click();
  await page.getByRole("menuitem", { name: "Archive", exact: true }).click();
  await expect(page.getByRole("link", { name: /Lunch at the market/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("link", { name: /Lunch at the market/ })).toBeVisible();
  expect(apiMock.transactions.find((item) => item.note === "Lunch at the market")?.hidden).toBe(
    false,
  );
});

test("editing preserves the original currency and recurrence metadata when the account changes", async ({
  page,
  apiMock,
}) => {
  await page.goto("/transactions?currency=EUR");
  await page.getByRole("link", { name: /Berlin stay/ }).click();
  await expectAmountCurrency(page, "€", "EUR");
  await page.getByLabel("Account", { exact: true }).selectOption(ids.everyday);
  await expectAmountCurrency(page, "€", "EUR");
  await page.getByLabel("Amount", { exact: true }).fill("91.25");
  await page.getByLabel("Note", { exact: true }).fill("Berlin stay updated");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/transactions\?currency=EUR$/);
  const updated = apiMock.transactions.find((item) => item.id === ids.euro)!;
  expect(updated.amount).toEqual({ value: 91.25, currency: { code: "EUR", symbol: "€" } });
  expect(updated.accountId).toBe(ids.everyday);
  expect(updated.parentTransactionId).toBe(ids.recurring);
  expect(updated.isRecurring).toBe(true);
  expect(updated.date).toBe("2026-09-10");
  expect(updated.tags).toEqual(["work", "travel"]);
});

test("an uncertain transaction save preserves the form and requires an explicit retry", async ({
  page,
  apiMock,
}) => {
  await page.goto("/transactions/new");
  await page.getByLabel("Amount", { exact: true }).fill("20.00");
  await chooseCategory(page, "Food & drink");
  apiMock.failureQueue.set("POST transactions", ["offline"]);
  await page.getByRole("button", { name: "Add transaction", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Amount", { exact: true })).toHaveValue("20.00");
  await expect(page.getByRole("button", { name: "Add transaction", exact: true })).toBeDisabled();
  expect(
    apiMock.requests.filter((item) => item.method === "POST" && item.path === "transactions"),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "I checked — enable retry", exact: true }).click();
  await page.getByRole("button", { name: "Add transaction", exact: true }).click();
  await expect(page).toHaveURL(/\/transactions\?currency=GBP$/);
  expect(apiMock.transactions.filter((item) => item.amount.value === 20)).toHaveLength(1);
});
