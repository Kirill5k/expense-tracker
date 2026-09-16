import type { Locator } from "@playwright/test";
import { test, expect, ids } from "./fixtures";
import { chooseCategory, expectAmountCurrency } from "./form-helpers";

const reports = [
  { name: "Overview", path: "/" },
  { name: "Transactions", path: "/transactions" },
  { name: "Recurring", path: "/recurring" },
] as const;

async function expectCurrencyOptions(currency: Locator, codes: string[]) {
  await expect(currency.locator("option")).toHaveCount(codes.length);
  expect((await currency.locator("option").allTextContents()).sort()).toEqual([...codes].sort());
}

for (const report of reports) {
  test(`${report.name}: All accounts shows a currency selector with only one currency`, async ({
    page,
    apiMock,
  }) => {
    apiMock.accounts = apiMock.accounts.filter((item) => item.id === ids.everyday);
    apiMock.transactions = apiMock.transactions.filter(
      (item) => item.amount.currency.code === "GBP",
    );
    await page.goto(report.path);
    const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
    const currency = page.getByRole("combobox", { name: "Reporting currency", exact: true });
    await expect(account).toHaveValue("");
    await expect(currency).toBeVisible();
    await expectCurrencyOptions(currency, ["GBP"]);
    await account.selectOption(ids.everyday);
    await expect(currency).toHaveCount(0);
    await account.selectOption("");
    await expect(currency).toBeVisible();
    await expectCurrencyOptions(currency, ["GBP"]);
  });

  test(`${report.name}: no visible accounts uses No account and the settings currency for stale URLs`, async ({
    page,
    apiMock,
  }) => {
    const usd = { code: "USD", symbol: "$" };
    apiMock.user.settings.currency = usd;
    apiMock.accounts.forEach((item) => {
      item.hidden = true;
    });
    apiMock.transactions = [
      {
        ...apiMock.transactions[0],
        accountId: null,
        note: "Dollar entry",
        amount: { value: 22.5, currency: usd },
      },
      {
        ...apiMock.transactions[0],
        id: "000000000000000000000051",
        accountId: null,
        note: "Euro entry",
        amount: { value: 9.7, currency: { code: "EUR", symbol: "€" } },
      },
      {
        ...apiMock.transactions[0],
        id: "000000000000000000000052",
        accountId: ids.everyday,
        note: "Assigned dollar entry",
        amount: { value: 100, currency: usd },
      },
    ];
    apiMock.recurring = apiMock.transactions.map((item) => ({
      ...apiMock.recurring[0],
      id: item.id,
      accountId: item.accountId,
      categoryId: item.categoryId,
      note: item.note,
      amount: item.amount,
    }));
    for (const query of ["", "?currency=EUR", `?account=${ids.travel}&currency=EUR`]) {
      await page.goto(`${report.path}${query}`);
      const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
      await expect(account).toHaveValue("unassigned");
      await expect(account.locator("option")).toHaveText(["No account"]);
      await expect(
        page.getByRole("combobox", { name: "Reporting currency", exact: true }),
      ).toHaveCount(0);
      await expect(page.getByRole("link", { name: /^Dollar entry/ })).toBeVisible();
      await expect(page.getByRole("link", { name: /^Euro entry/ })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /^Assigned dollar entry/ })).toHaveCount(0);
      if (report.name === "Overview") {
        await expect(
          page.getByRole("region", { name: "Financial summary" }).getByText("-US$22.50", {
            exact: true,
          }),
        ).toBeVisible();
      }
    }
    apiMock.transactions = [];
    apiMock.recurring = [];
    await page.reload();
    const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
    await expect(account).toHaveValue("unassigned");
    await expect(account.locator("option")).toHaveText(["No account"]);
    await expect(
      page.getByRole("combobox", { name: "Reporting currency", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Dollar entry/ })).toHaveCount(0);
  });

  test(`${report.name}: choosing No account uses the settings currency`, async ({
    page,
    apiMock,
  }) => {
    const usd = { code: "USD", symbol: "$" };
    apiMock.user.settings.currency = usd;
    apiMock.transactions.push(
      {
        ...apiMock.transactions[0],
        id: "000000000000000000000053",
        accountId: null,
        note: "Unassigned dollars",
        amount: { value: 12.3, currency: usd },
      },
      {
        ...apiMock.transactions[0],
        id: "000000000000000000000054",
        accountId: null,
        note: "Unassigned euros",
        amount: { value: 9.7, currency: { code: "EUR", symbol: "€" } },
      },
    );
    apiMock.recurring.push(
      ...apiMock.transactions.slice(-2).map((item) => ({
        ...apiMock.recurring[0],
        id: item.id,
        accountId: item.accountId,
        note: item.note,
        amount: item.amount,
      })),
    );
    await page.goto(`${report.path}?currency=EUR`);
    const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
    const currency = page.getByRole("combobox", { name: "Reporting currency", exact: true });
    await expect(currency).toHaveValue("EUR");
    await expect(page.getByRole("link", { name: /^Unassigned euros/ })).toBeVisible();
    await account.selectOption("unassigned");
    await expect(currency).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Unassigned dollars/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Unassigned euros/ })).toHaveCount(0);
    await page.reload();
    await expect(account).toHaveValue("unassigned");
    await expect(currency).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Unassigned dollars/ })).toBeVisible();
  });
}

test("recurring account, currency, and transaction type filters work together", async ({
  page,
  apiMock,
}) => {
  const eur = { code: "EUR", symbol: "€" };
  apiMock.recurring.push(
    {
      ...apiMock.recurring[0],
      id: "000000000000000000000055",
      accountId: ids.travel,
      note: "Euro subscription",
      amount: { value: 19, currency: eur },
    },
    {
      ...apiMock.recurring[0],
      id: "000000000000000000000056",
      accountId: ids.travel,
      categoryId: ids.salary,
      note: "Euro salary",
      amount: { value: 500, currency: eur },
    },
    {
      ...apiMock.recurring[0],
      id: "000000000000000000000057",
      note: "Legacy euro schedule",
      amount: { value: 5, currency: eur },
    },
  );
  await page.goto("/recurring");
  const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
  const currency = page.getByRole("combobox", { name: "Reporting currency", exact: true });
  const kind = page.getByRole("combobox", {
    name: "Filter recurring transaction type",
    exact: true,
  });
  await expect(page.getByRole("link", { name: /^Music subscription/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Euro salary/ })).toHaveCount(0);
  await currency.selectOption("EUR");
  await expect(page.getByRole("link", { name: /^Euro subscription/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Euro salary/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Legacy euro schedule/ })).toBeVisible();
  await kind.selectOption("income");
  await expect(page.getByRole("link", { name: /^Euro salary/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Euro subscription/ })).toHaveCount(0);
  await account.selectOption(ids.travel);
  await expect(currency).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Euro salary/ })).toBeVisible();
  await kind.selectOption("expense");
  await expect(page.getByRole("link", { name: /^Euro subscription/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Euro salary/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Legacy euro schedule/ })).toHaveCount(0);
  await account.selectOption(ids.everyday);
  await expectCurrencyOptions(currency, ["EUR", "GBP"]);
  await currency.selectOption("EUR");
  await expect(page.getByRole("link", { name: /^Legacy euro schedule/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Music subscription/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Euro subscription/ })).toHaveCount(0);
});

test("reporting follows the selected account and keeps all-account currencies separate", async ({
  page,
}) => {
  await page.goto("/");
  const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
  const currency = page.getByRole("combobox", { name: "Reporting currency", exact: true });
  const summary = page.getByRole("region", { name: "Financial summary" });
  await expectCurrencyOptions(currency, ["EUR", "GBP"]);
  await expect(summary.getByText("£1,974.30", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Add transaction", exact: true })).toHaveCount(0);
  await currency.selectOption("EUR");
  await expect(summary.getByText("-€89.95", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Morning coffee/ })).toHaveCount(0);
  await account.selectOption(ids.everyday);
  await expect(currency).toHaveCount(0);
  await expect(summary.getByText("£1,974.30", { exact: true })).toBeVisible();
  await account.selectOption(ids.travel);
  await expect(currency).toHaveCount(0);
  await expect(summary.getByText("-€89.95", { exact: true })).toBeVisible();
  await account.selectOption("");
  await expectCurrencyOptions(currency, ["EUR", "GBP"]);
});

test("historical currencies remain reportable on their original account", async ({
  page,
  apiMock,
}) => {
  apiMock.transactions.push({
    ...apiMock.transactions[0],
    id: "000000000000000000000050",
    note: "Legacy euro expense",
    amount: { value: 7.2, currency: { code: "EUR", symbol: "€" } },
  });
  await page.goto(`/transactions?account=${ids.everyday}&currency=USD`);
  const currency = page.getByRole("combobox", { name: "Reporting currency", exact: true });
  await expect(currency).toHaveValue("GBP");
  await expectCurrencyOptions(currency, ["EUR", "GBP"]);
  await currency.selectOption("EUR");
  await expect(page.getByRole("link", { name: /Legacy euro expense/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Morning coffee/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Berlin stay/ })).toHaveCount(0);
});

test("No account appears for matching historical records and stays reachable from a saved filter", async ({
  page,
}) => {
  const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
  await page.goto("/transactions");
  await expect(account).toBeVisible();
  await expect(account.getByRole("option", { name: "No account", exact: true })).toHaveCount(0);
  await page.goto("/transactions?period=custom&from=2026-08-01&to=2026-08-31");
  await expect(account.getByRole("option", { name: "No account", exact: true })).toHaveCount(1);
  await account.selectOption("unassigned");
  await expect(page.getByRole("link", { name: /August lunch/ })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Reporting currency", exact: true })).toHaveCount(
    0,
  );
  await page.goto("/transactions?account=unassigned");
  await expect(account).toHaveValue("unassigned");
  await expect(account.getByRole("option", { name: "No account", exact: true })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "A fresh start", exact: true })).toBeVisible();
});

for (const kind of ["transaction", "recurring"] as const) {
  test(`new ${kind} uses its account currency and resets No account to the profile currency`, async ({
    page,
    apiMock,
  }) => {
    const path = kind === "transaction" ? "/transactions/new" : "/recurring/new";
    const submitLabel = kind === "transaction" ? "Add transaction" : "Create recurring";
    for (const assignment of ["account", "none"] as const) {
      await page.goto(path);
      const account = page.getByRole("combobox", { name: "Account", exact: true });
      await expectAmountCurrency(page, "£", "GBP");
      await account.selectOption(ids.travel);
      await expectAmountCurrency(page, "€", "EUR");
      if (assignment === "none") {
        await account.selectOption({ label: "No account" });
        await expectAmountCurrency(page, "£", "GBP");
      }
      await page.getByLabel("Amount", { exact: true }).fill("23.45");
      await chooseCategory(page, "Food & drink");
      const note = `${kind} ${assignment} FX`;
      await page.getByLabel("Note", { exact: true }).fill(note);
      await page.getByRole("button", { name: submitLabel, exact: true }).click();
      await expect(page).toHaveURL(kind === "transaction" ? /\/transactions\?/ : /\/recurring$/);
      const rows = kind === "transaction" ? apiMock.transactions : apiMock.recurring;
      const saved = rows.find((item) => item.note === note);
      expect(saved?.accountId).toBe(assignment === "account" ? ids.travel : null);
      expect(saved?.amount).toEqual({
        value: 23.45,
        currency:
          assignment === "account" ? { code: "EUR", symbol: "€" } : { code: "GBP", symbol: "£" },
      });
    }
  });
}
