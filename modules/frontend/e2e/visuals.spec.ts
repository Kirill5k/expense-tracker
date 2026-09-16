import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";

test("desktop main screens have no serious accessibility violations", async ({ page }) => {
  for (const [path, heading] of [
    ["/transactions", "Transactions"],
    ["/accounts", "Accounts"],
    ["/categories", "Categories"],
    ["/settings", "Settings"],
  ]) {
    await test.step(heading, async () => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
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
    });
  }
});

test("capture desktop overview in both themes", async ({ page, apiMock }, testInfo) => {
  for (const theme of ["light", "dark"] as const) {
    apiMock.user.settings.darkMode = theme === "dark";
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Financial summary" })
        .getByText("£1,974.30", { exact: true }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    await expect(page.getByRole("status", { name: "Loading", exact: true })).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath(`overview-${theme}-desktop.png`),
      animations: "disabled",
      scale: "css",
    });
  }
});
