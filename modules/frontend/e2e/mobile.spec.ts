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
