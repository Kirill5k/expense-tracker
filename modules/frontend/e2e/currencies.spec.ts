import { test, expect, ids } from "./fixtures";
import { chooseCategory, expectAmountCurrency } from "./form-helpers";

const reports = [
  { name: "Overview", path: "/" },
  { name: "Transactions", path: "/transactions" },
  { name: "Recurring", path: "/recurring" },
] as const;

for (const report of reports) {
  test(`${report.name}: only visible accounts are offered and legacy filters default to the main account`, async ({
    page,
    apiMock,
  }) => {
    // The main account need not be first in the backend response.
    apiMock.accounts.reverse();
    apiMock.accounts.push({
      ...apiMock.accounts[0],
      id: "000000000000000000000012",
      name: "Archived account",
      hidden: true,
    });
    apiMock.transactions.push({
      ...apiMock.transactions[0],
      id: "000000000000000000000053",
      accountId: null,
      note: "Unassigned expense",
    });
    apiMock.recurring.push({
      ...apiMock.recurring[0],
      id: "000000000000000000000054",
      accountId: null,
      note: "Unassigned expense",
    });
    for (const query of [
      "",
      "?account=&currency=EUR",
      "?account=unassigned&currency=EUR",
      "?account=missing&currency=EUR",
      "?account=000000000000000000000012&currency=EUR",
    ]) {
      await page.goto(`${report.path}${query}`);
      const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
      await expect(account).toHaveValue(ids.everyday);
      await expect(account.locator("option")).toHaveText(["Travel · EUR", "Everyday · GBP"]);
      await expect(
        page.getByRole("combobox", { name: "Reporting currency", exact: true }),
      ).toHaveCount(0);
      await expect(page.getByRole("link", { name: /^Unassigned expense/ })).toHaveCount(0);
      await expect(
        page.getByRole("link", {
          name: report.name === "Recurring" ? /^Music subscription/ : /^Morning coffee/,
        }),
      ).toBeVisible();
    }
  });

  test(`${report.name}: selecting an account determines currency and survives refresh`, async ({
    page,
    apiMock,
  }) => {
    apiMock.recurring.push({
      ...apiMock.recurring[0],
      id: "000000000000000000000055",
      accountId: ids.travel,
      note: "Euro subscription",
      amount: { value: 19, currency: { code: "EUR", symbol: "€" } },
    });
    await page.goto(`${report.path}?currency=USD`);
    const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
    const euroEntry = page.getByRole("link", {
      name: report.name === "Recurring" ? /^Euro subscription/ : /^Berlin stay/,
    });
    const sterlingEntry = page.getByRole("link", {
      name: report.name === "Recurring" ? /^Music subscription/ : /^Morning coffee/,
    });
    await expect(account).toHaveValue(ids.everyday);
    await expect(sterlingEntry).toBeVisible();
    await expect(euroEntry).toHaveCount(0);
    await account.selectOption(ids.travel);
    await expect(euroEntry).toBeVisible();
    await expect(sterlingEntry).toHaveCount(0);
    await expect(
      page.getByRole("combobox", { name: "Reporting currency", exact: true }),
    ).toHaveCount(0);
    await page.reload();
    await expect(account).toHaveValue(ids.travel);
    await expect(euroEntry).toBeVisible();
    await page.goto(`${report.path}?account=${ids.travel}&currency=GBP`);
    await expect(account).toHaveValue(ids.travel);
    await expect(euroEntry).toBeVisible();
    await expect(sterlingEntry).toHaveCount(0);
    // A saved selection also recovers when that account is later archived.
    apiMock.accounts.find((item) => item.id === ids.travel)!.hidden = true;
    await page.reload();
    await expect(account).toHaveValue(ids.everyday);
    await expect(sterlingEntry).toBeVisible();
    await expect(euroEntry).toHaveCount(0);
  });

  test(`${report.name}: the first visible account is selected when there is no main account`, async ({
    page,
    apiMock,
  }) => {
    apiMock.accounts.reverse();
    apiMock.accounts.forEach((item) => {
      item.isMain = false;
    });
    await page.goto(report.path);
    const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
    await expect(account).toHaveValue(ids.travel);
    await expect(account.locator("option")).toHaveText(["Travel · EUR", "Everyday · GBP"]);
    await expect(
      page.getByRole("combobox", { name: "Reporting currency", exact: true }),
    ).toHaveCount(0);
  });

  test(`${report.name}: no visible accounts uses No Account and the settings currency for stale URLs`, async ({
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
      await expect(account.locator("option")).toHaveText(["No Account"]);
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
    apiMock.accounts = [];
    apiMock.transactions = [];
    apiMock.recurring = [];
    await page.reload();
    const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
    await expect(account).toHaveValue("unassigned");
    await expect(account.locator("option")).toHaveText(["No Account"]);
    await expect(
      page.getByRole("combobox", { name: "Reporting currency", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Dollar entry/ })).toHaveCount(0);
  });
}

test("recurring account and transaction type filters work together using the account currency", async ({
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
  const kind = page.getByRole("combobox", {
    name: "Filter recurring transaction type",
    exact: true,
  });
  await expect(page.getByRole("link", { name: /^Music subscription/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Euro salary/ })).toHaveCount(0);
  await account.selectOption(ids.travel);
  await expect(page.getByRole("link", { name: /^Euro subscription/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Euro salary/ })).toBeVisible();
  await kind.selectOption("income");
  await expect(page.getByRole("link", { name: /^Euro salary/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Euro subscription/ })).toHaveCount(0);
  await kind.selectOption("expense");
  await expect(page.getByRole("link", { name: /^Euro subscription/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Euro salary/ })).toHaveCount(0);
  await account.selectOption(ids.everyday);
  await expect(page.getByRole("link", { name: /^Music subscription/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Legacy euro schedule/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Euro subscription/ })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Reporting currency", exact: true })).toHaveCount(
    0,
  );
});

test("overview totals follow each selected account's currency", async ({ page }) => {
  await page.goto("/");
  const account = page.getByRole("combobox", { name: "Filter by account", exact: true });
  const summary = page.getByRole("region", { name: "Financial summary" });
  await expect(account).toHaveValue(ids.everyday);
  await expect(summary.getByText("£1,974.30", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Add transaction", exact: true })).toHaveCount(0);
  await account.selectOption(ids.travel);
  await expect(summary.getByText("-€89.95", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Morning coffee/ })).toHaveCount(0);
  await account.selectOption(ids.everyday);
  await expect(summary.getByText("£1,974.30", { exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Reporting currency", exact: true })).toHaveCount(
    0,
  );
});

test("stale currency URLs do not change an account's reporting currency or mix historical currencies", async ({
  page,
  apiMock,
}) => {
  apiMock.transactions.push({
    ...apiMock.transactions[0],
    id: "000000000000000000000050",
    note: "Legacy euro expense",
    amount: { value: 7.2, currency: { code: "EUR", symbol: "€" } },
  });
  await page.goto(`/transactions?account=${ids.everyday}&currency=EUR`);
  await expect(page.getByRole("combobox", { name: "Filter by account", exact: true })).toHaveValue(
    ids.everyday,
  );
  await expect(page.getByRole("combobox", { name: "Reporting currency", exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole("link", { name: /Morning coffee/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Legacy euro expense/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Berlin stay/ })).toHaveCount(0);
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
      const destination = kind === "transaction" ? "/transactions" : "/recurring";
      await expect(page).toHaveURL(
        `${destination}${assignment === "account" ? `?account=${ids.travel}` : ""}`,
      );
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
