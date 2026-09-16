import { test, expect, ids } from "./fixtures";
import { chooseCategory, expectAmountCurrency } from "./form-helpers";

test("a recurring schedule can be created and stopped while keeping transaction history", async ({
  page,
  apiMock,
}) => {
  const historyCount = apiMock.transactions.length;
  await page.goto("/recurring");
  await page.getByRole("link", { name: "New recurring", exact: true }).click();
  await page.getByLabel("Amount", { exact: true }).fill("45.50");
  await chooseCategory(page, "Bills & subscriptions");
  await page.getByLabel("Repeat every", { exact: true }).fill("2");
  await page.getByLabel("Frequency", { exact: true }).selectOption("weekly");
  await page.getByLabel("Start date", { exact: true }).fill("2026-09-15");
  await page.getByLabel("End date", { exact: true }).fill("2026-12-15");
  await page.getByLabel("Note", { exact: true }).fill("Fortnightly class");
  await page.getByRole("button", { name: "Create recurring", exact: true }).click();
  await expect(page).toHaveURL(/\/recurring$/);
  const schedule = apiMock.recurring.find((item) => item.note === "Fortnightly class")!;
  expect(schedule.recurrence).toMatchObject({
    interval: 2,
    frequency: "weekly",
    startDate: "2026-09-15",
    endDate: "2026-12-15",
  });
  await page.getByRole("button", { name: "Stop Fortnightly class", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText(
    "Transactions already in your history are kept",
  );
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Stop recurring transaction", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Stop Fortnightly class", exact: true }),
  ).toHaveCount(0);
  expect(schedule.hidden).toBe(true);
  expect(apiMock.transactions).toHaveLength(historyCount);
});

test("editing a recurring schedule keeps its stored next date and original currency", async ({
  page,
  apiMock,
}) => {
  await page.goto(`/recurring/${ids.recurring}`);
  await expectAmountCurrency(page, "£", "GBP");
  await page.getByLabel("Account", { exact: true }).selectOption(ids.travel);
  await expectAmountCurrency(page, "£", "GBP");
  await page.getByLabel("Amount", { exact: true }).fill("14.99");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/recurring$/);
  const schedule = apiMock.recurring.find((item) => item.id === ids.recurring)!;
  expect(schedule.amount).toEqual({ value: 14.99, currency: { code: "GBP", symbol: "£" } });
  expect(schedule.accountId).toBe(ids.travel);
  expect(schedule.recurrence.nextDate).toBe("2026-09-20");
  expect(schedule.tags).toEqual(["monthly"]);
});

test("an uncertain recurring save requires an explicit retry and creates one schedule", async ({
  page,
  apiMock,
}) => {
  await page.goto("/recurring/new");
  await page.getByLabel("Amount", { exact: true }).fill("9.50");
  await chooseCategory(page, "Bills & subscriptions");
  await page.getByLabel("Note", { exact: true }).fill("New subscription");
  apiMock.failureQueue.set("POST periodic-transactions", ["offline"]);
  await page.getByRole("button", { name: "Create recurring", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Amount", { exact: true })).toHaveValue("9.50");
  await expect(page.getByRole("button", { name: "Create recurring", exact: true })).toBeDisabled();
  expect(
    apiMock.requests.filter(
      (request) => request.method === "POST" && request.path === "periodic-transactions",
    ),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "I checked — enable retry", exact: true }).click();
  await page.getByRole("button", { name: "Create recurring", exact: true }).click();
  await expect(page).toHaveURL(/\/recurring$/);
  expect(apiMock.recurring.filter((item) => item.note === "New subscription")).toHaveLength(1);
});
