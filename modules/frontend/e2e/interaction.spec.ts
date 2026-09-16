import type { Locator, Page } from "@playwright/test";
import { test, expect } from "./fixtures";

async function tabTo(page: Page, target: Locator, limit = 50) {
  for (let step = 0; step < limit; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
}

test("tablet portrait and landscape keep navigation and transaction controls usable", async ({
  page,
}) => {
  for (const viewport of [
    { width: 820, height: 1180 },
    { width: 1180, height: 820 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Financial summary" })).toBeVisible();
    const navigation = page.getByRole("navigation", {
      name: viewport.width < 1024 ? "Mobile navigation" : "Main navigation",
    });
    await expect(navigation).toBeVisible();
    await navigation.getByRole("link", { name: "Transactions", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Transactions", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Morning coffee/ })).toBeVisible();
    await page.getByRole("link", { name: "Add transaction", exact: true }).click();
    await expect(page.getByLabel("Amount", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Category", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    ).toBe(false);
  }
});

test("keyboard navigation opens menus and traps dialog focus with a safe escape", async ({
  page,
  apiMock,
}) => {
  await page.goto("/transactions");
  const actions = page.getByRole("button", { name: "Actions for Morning coffee", exact: true });
  await expect(actions).toBeVisible();
  await tabTo(page, actions);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Edit", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Make a copy", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(actions).toBeFocused();

  await page.goto("/settings");
  const clearTrigger = page.getByRole("button", { name: "Clear all data", exact: true });
  await expect(clearTrigger).toBeVisible();
  await tabTo(page, clearTrigger);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("alertdialog", { name: "Clear all your financial data?" });
  const confirmation = dialog.getByLabel("Type DELETE to confirm", { exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Clear all data", exact: true })).toBeDisabled();
  await tabTo(page, confirmation, 5);
  await page.keyboard.type("DELETE");
  await expect(dialog.getByRole("button", { name: "Clear all data", exact: true })).toBeEnabled();
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(clearTrigger).toBeFocused();
  expect(apiMock.requests.filter((request) => request.method === "DELETE")).toEqual([]);
});
