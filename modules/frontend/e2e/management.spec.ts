import { test, expect, ids } from "./fixtures";

test("accounts can be created, renamed, and archived with confirmation", async ({
  page,
  apiMock,
}) => {
  await page.goto("/accounts");
  await page.getByRole("link", { name: "New account", exact: true }).click();
  await page.getByLabel("Account name", { exact: true }).fill("Holiday spending");
  await page.getByLabel("Currency", { exact: true }).selectOption("EUR");
  await page.getByRole("button", { name: "Save account", exact: true }).click();
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByRole("heading", { name: "Holiday spending", exact: true })).toBeVisible();
  const account = apiMock.accounts.find((item) => item.name === "Holiday spending")!;
  await page.locator(`a[href="/accounts/${account.id}"]`).click();
  await expect(page).toHaveURL(`/accounts/${account.id}`);
  await expect(page.getByRole("combobox", { name: "Currency", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Currency", { exact: true })).toHaveAttribute("readonly", "");
  await expect(page.getByLabel("Currency", { exact: true })).toHaveValue("EUR — €");
  await page.getByLabel("Account name", { exact: true }).fill("Holiday fund");
  await page.getByRole("button", { name: "Save account", exact: true }).click();
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByRole("heading", { name: "Holiday fund", exact: true })).toBeVisible();
  expect(account.currency).toEqual({ code: "EUR", symbol: "€" });
  await page.locator(`a[href="/accounts/${account.id}"]`).click();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("also hides transactions");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(account.hidden).not.toBe(true);
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByRole("heading", { name: "Holiday fund", exact: true })).toHaveCount(0);
  expect(account.hidden).toBe(true);
});

test("categories support creation, editing, and safe archive", async ({ page, apiMock }) => {
  await page.goto("/categories");
  await page.getByRole("link", { name: "New category", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Hobbies");
  await page.getByLabel("Type", { exact: true }).selectOption("expense");
  await page.getByLabel("Custom colour", { exact: true }).fill("#2563EB");
  await page.getByRole("button", { name: "Save category", exact: true }).click();
  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.getByRole("heading", { name: "Hobbies", exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Hobbies/ }).click();
  await expect(page).toHaveURL(/\/categories\/[a-f0-9]{24}$/);
  await page.getByLabel("Name", { exact: true }).fill("Weekend hobbies");
  await page.getByRole("button", { name: "Save category", exact: true }).click();
  await expect(page).toHaveURL(/\/categories$/);
  await page.getByRole("link", { name: /Weekend hobbies/ }).click();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("stops its recurring transactions");
  await page.getByRole("alertdialog").getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page).toHaveURL(/\/categories$/);
  expect(apiMock.categories.find((item) => item.name === "Weekend hobbies")?.hidden).toBe(true);
});

test("preference changes are persisted and incorrect current passwords preserve the session", async ({
  page,
  apiMock,
}) => {
  await page.goto("/settings");
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await page.getByLabel("Future transactions", { exact: true }).selectOption("7");
  await page.getByRole("button", { name: "Save preferences", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(apiMock.user.settings).toMatchObject({
    darkMode: true,
    hideFutureTransactions: false,
    futureTransactionVisibilityDays: 7,
  });
  await page.getByLabel("Current password", { exact: true }).fill("incorrect-password");
  await page.getByLabel("New password", { exact: true }).fill("changed-password-for-test");
  await page.getByLabel("Confirm new password", { exact: true }).fill("changed-password-for-test");
  await page.getByRole("button", { name: "Update password", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("appears to be incorrect");
  await expect(page).toHaveURL(/\/settings$/);
  expect(apiMock.authenticated).toBe(true);
  await page.getByLabel("Current password", { exact: true }).fill(apiMock.password);
  await page.getByRole("button", { name: "Update password", exact: true }).click();
  await expect(page).toHaveURL(/\/signin$/);
  expect(apiMock.authenticated).toBe(false);
});

test("clearing financial data requires typed confirmation and keeps the user signed in", async ({
  page,
  apiMock,
}) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Clear all data", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByRole("button", { name: "Clear all data", exact: true })).toBeDisabled();
  await dialog.getByLabel("Type DELETE to confirm", { exact: true }).fill("DELETE");
  await dialog.getByRole("button", { name: "Clear all data", exact: true }).click();
  await expect.poll(() => apiMock.transactions.length).toBe(0);
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  expect(apiMock.authenticated).toBe(true);
  expect(apiMock.user.id).toBe(ids.user);
});
