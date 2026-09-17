import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";

test("phone navigation exposes the full workspace and signs out", async ({ page, apiMock }) => {
  await page.goto("/transactions");
  const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(navigation).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
  await navigation.getByRole("link", { name: "Accounts", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Accounts", exact: true })).toBeVisible();
  await navigation.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("menuitem", { name: "Categories", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Categories", exact: true })).toBeVisible();
  await navigation.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("menuitem", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(page.getByLabel("Default currency", { exact: true })).toBeVisible();
  await navigation.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/signin$/);
  expect(apiMock.authenticated).toBe(false);
});

test("capture phone overview in both themes without horizontal overflow", async ({
  page,
  apiMock,
}, testInfo) => {
  for (const theme of ["light", "dark"] as const) {
    apiMock.user.settings.darkMode = theme === "dark";
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Financial summary" })
        .getByText("£1,974.30", { exact: true }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    await expect(page.getByRole("status", { name: "Loading", exact: true })).toHaveCount(0);
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({
      path: testInfo.outputPath(`overview-${theme}-phone.png`),
      animations: "disabled",
      scale: "css",
    });
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations
        .filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))
        .map((violation) => ({
          id: violation.id,
          targets: violation.nodes.map((node) => node.target),
        })),
    ).toEqual([]);
  }
});

for (const report of [
  { name: "Overview", path: "/" },
  { name: "Transactions", path: "/transactions" },
  { name: "Recurring", path: "/recurring" },
]) {
  for (const hasAccounts of [true, false]) {
    test(`${report.name}: the ${hasAccounts ? "account" : "No Account"} selector fills the phone content width`, async ({
      page,
      apiMock,
    }) => {
      if (!hasAccounts) apiMock.accounts = [];
      await page.goto(report.path);
      const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
      await expect(account).toBeVisible();
      await expect(account.locator("option")).toHaveCount(hasAccounts ? 2 : 1);
      if (!hasAccounts) await expect(account.locator("option")).toHaveText(["No Account"]);
      await expect(
        page.getByRole("combobox", { name: "Reporting currency", exact: true }),
      ).toHaveCount(0);
      const layout = await account.evaluate((element) => {
        const select = element.getBoundingClientRect();
        const main = element.closest("main")!;
        const bounds = main.getBoundingClientRect();
        const style = getComputedStyle(main);
        return {
          left: select.left,
          right: select.right,
          contentLeft:
            bounds.left + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth),
          contentRight:
            bounds.right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth),
          viewport: window.innerWidth,
          pageWidth: document.documentElement.scrollWidth,
        };
      });
      expect(
        Math.abs(layout.left - layout.contentLeft),
        JSON.stringify(layout),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(layout.right - layout.contentRight),
        JSON.stringify(layout),
      ).toBeLessThanOrEqual(1);
      expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport);
    });
  }
}
