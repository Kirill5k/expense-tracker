import type { Locator, Page } from "@playwright/test";
import { test, expect, ids } from "./fixtures";

async function expectPeriod(page: Page, period: string, label: string) {
  await expect(page.getByRole("combobox", { name: "Reporting period", exact: true })).toHaveValue(
    period,
  );
  await expect(page.getByTitle(label, { exact: true })).toBeVisible();
}

async function expectQuery(page: Page, values: Record<string, string>) {
  await expect(page).toHaveURL((url) =>
    Object.entries(values).every(([key, value]) => url.searchParams.get(key) === value),
  );
}

async function navigateToReport(
  page: Page,
  navigation: Locator,
  name: "Overview" | "Transactions" | "Recurring",
) {
  await navigation.getByRole("link", { name, exact: true }).click();
  await expect(page).toHaveURL(
    (url) => url.pathname === (name === "Overview" ? "/" : `/${name.toLowerCase()}`),
  );
  await expect(
    page.getByRole("heading", { name: name === "Overview" ? "Hello, Alex" : name, exact: true }),
  ).toBeVisible();
}

for (const layout of [
  { name: "sidebar", navigation: "Main navigation", viewport: { width: 1440, height: 1000 } },
  { name: "phone toolbar", navigation: "Mobile navigation", viewport: { width: 390, height: 844 } },
]) {
  test.describe(layout.name, () => {
    test.use({ viewport: layout.viewport });

    test("shares the selected month, week, and custom range between reports in both directions", async ({
      page,
    }) => {
      await page.goto("/");
      const navigation = page.getByRole("navigation", { name: layout.navigation, exact: true });
      await expectPeriod(page, "month", "September 2026");
      await page.getByRole("button", { name: "Previous period", exact: true }).click();
      await expectPeriod(page, "month", "August 2026");

      await navigateToReport(page, navigation, "Transactions");
      await expectPeriod(page, "month", "August 2026");
      await expect(page.getByRole("link", { name: /Morning coffee/ })).toHaveCount(0);
      await page
        .getByRole("combobox", { name: "Reporting period", exact: true })
        .selectOption("week");
      await expectPeriod(page, "week", "13 Sep – 19 Sep 2026");
      await expect(page.getByRole("link", { name: /Morning coffee/ })).toBeVisible();
      await page.getByRole("button", { name: "Previous period", exact: true }).click();
      await expectPeriod(page, "week", "6 Sep – 12 Sep 2026");

      await navigateToReport(page, navigation, "Overview");
      await expectPeriod(page, "week", "6 Sep – 12 Sep 2026");
      await page
        .getByRole("combobox", { name: "Reporting period", exact: true })
        .selectOption("custom");
      await page.getByLabel("Start date", { exact: true }).fill("2026-08-20");
      await expectQuery(page, { from: "2026-08-20", to: "2026-09-12", period: "custom" });
      await page.getByLabel("End date", { exact: true }).fill("2026-09-05");
      await expectPeriod(page, "custom", "20 Aug – 5 Sep 2026");

      await navigateToReport(page, navigation, "Recurring");
      await navigateToReport(page, navigation, "Transactions");
      await expectPeriod(page, "custom", "20 Aug – 5 Sep 2026");
      await expect(page.getByLabel("Start date", { exact: true })).toHaveValue("2026-08-20");
      await expect(page.getByLabel("End date", { exact: true })).toHaveValue("2026-09-05");
      await page.getByRole("button", { name: "Next period", exact: true }).click();
      await expectPeriod(page, "custom", "6 Sep – 22 Sep 2026");

      await navigateToReport(page, navigation, "Overview");
      await expectPeriod(page, "custom", "6 Sep – 22 Sep 2026");
    });
  });
}

test("changing the shared reporting period preserves transaction search and account filters", async ({
  page,
}) => {
  await page.goto(`/transactions?account=${ids.travel}&search=Berlin&kind=expense`);
  await page.getByRole("combobox", { name: "Reporting period", exact: true }).selectOption("year");
  await expectPeriod(page, "year", "2026");
  await page.getByRole("button", { name: "Previous period", exact: true }).click();
  await expectPeriod(page, "year", "2025");
  await expectQuery(page, {
    account: ids.travel,
    search: "Berlin",
    kind: "expense",
    period: "year",
    from: "2025-01-01",
    to: "2025-12-31",
  });
  await expect(page.getByRole("combobox", { name: "Filter by account", exact: true })).toHaveValue(
    ids.travel,
  );
  await expect(page.getByRole("textbox", { name: "Search transactions", exact: true })).toHaveValue(
    "Berlin",
  );

  await navigateToReport(
    page,
    page.getByRole("navigation", { name: "Main navigation", exact: true }),
    "Overview",
  );
  await expectPeriod(page, "year", "2025");
});

test("explicit date URLs take precedence when navigating back and forward", async ({ page }) => {
  await page.goto("/?period=week&from=2026-09-06&to=2026-09-12");
  const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
  await expectPeriod(page, "week", "6 Sep – 12 Sep 2026");
  await navigateToReport(page, navigation, "Transactions");
  await expectPeriod(page, "week", "6 Sep – 12 Sep 2026");
  await page.getByRole("button", { name: "Next period", exact: true }).click();
  await expectPeriod(page, "week", "13 Sep – 19 Sep 2026");
  await expectQuery(page, { period: "week", from: "2026-09-13", to: "2026-09-19" });

  await page.goBack();
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect(page.getByRole("heading", { name: "Hello, Alex", exact: true })).toBeVisible();
  await expectPeriod(page, "week", "6 Sep – 12 Sep 2026");
  await page.goForward();
  await expect(page).toHaveURL((url) => url.pathname === "/transactions");
  await expect(page.getByRole("heading", { name: "Transactions", exact: true })).toBeVisible();
  await expectPeriod(page, "week", "13 Sep – 19 Sep 2026");

  await navigateToReport(page, navigation, "Overview");
  await expectPeriod(page, "week", "13 Sep – 19 Sep 2026");
});
