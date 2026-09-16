import { test, expect, ids } from "./fixtures";
import { chooseCategory, expectAmountCurrency } from "./form-helpers";

for (const kind of ["transaction", "recurring"] as const) {
  test(`${kind} form starts with Account and supports category icons and keyboard tag pills`, async ({
    page,
    apiMock,
  }) => {
    apiMock.user.settings.currency = { code: "USD", symbol: "$" };
    const path = kind === "transaction" ? "/transactions/new" : "/recurring/new";
    const endpoint = kind === "transaction" ? "transactions" : "periodic-transactions";
    const submitLabel = kind === "transaction" ? "Add transaction" : "Create recurring";
    await page.goto(path);
    const account = page.getByRole("combobox", { name: "Account", exact: true });
    const amount = page.getByRole("textbox", { name: "Amount", exact: true });
    await expect(account).toBeVisible();
    const accountBounds = await account.boundingBox();
    const typeBounds = await page
      .getByRole("group", {
        name: kind === "transaction" ? "Transaction type" : "Recurring transaction type",
      })
      .boundingBox();
    const amountBounds = await amount.boundingBox();
    expect(accountBounds).not.toBeNull();
    expect(typeBounds).not.toBeNull();
    expect(amountBounds).not.toBeNull();
    expect(accountBounds!.y + accountBounds!.height).toBeLessThan(typeBounds!.y);
    expect(accountBounds!.y + accountBounds!.height).toBeLessThan(amountBounds!.y);
    await account.selectOption(ids.travel);
    await expectAmountCurrency(page, "€", "EUR");
    await account.selectOption({ label: "No account" });
    await expectAmountCurrency(page, "$", "USD");
    const amountFieldBounds = await page.locator('[data-slot="amount-input"]').boundingBox();
    const symbolBounds = await page.locator('[data-slot="currency-symbol"]').boundingBox();
    expect(amountFieldBounds).not.toBeNull();
    expect(symbolBounds).not.toBeNull();
    expect(symbolBounds!.x).toBeGreaterThanOrEqual(amountFieldBounds!.x);
    expect(symbolBounds!.x + symbolBounds!.width).toBeLessThanOrEqual(
      amountFieldBounds!.x + amountFieldBounds!.width,
    );
    expect(symbolBounds!.y).toBeGreaterThanOrEqual(amountFieldBounds!.y);
    expect(symbolBounds!.y + symbolBounds!.height).toBeLessThanOrEqual(
      amountFieldBounds!.y + amountFieldBounds!.height,
    );

    const category = page.getByRole("button", { name: "Category", exact: true });
    const emptyCategoryBounds = await category.boundingBox();
    await chooseCategory(page, "Food & drink");
    const selectedCategoryBounds = await category.boundingBox();
    expect(emptyCategoryBounds).not.toBeNull();
    expect(selectedCategoryBounds).not.toBeNull();
    expect(
      Math.abs(emptyCategoryBounds!.height - selectedCategoryBounds!.height),
    ).toBeLessThanOrEqual(1);
    await amount.fill("10, 20");
    await page.getByRole("button", { name: submitLabel, exact: true }).click();
    await expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(
      apiMock.requests.filter((request) => request.method === "POST" && request.path === endpoint),
    ).toHaveLength(0);
    await amount.fill("18.75");

    await category.focus();
    await page.keyboard.press("Space");
    const food = page.getByRole("menuitemradio", { name: "Food & drink", exact: true });
    await expect(food).toBeVisible();
    await expect(food.locator('span[aria-hidden="true"] svg path').first()).toBeVisible();
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
    await expect(category).toHaveText("Food & drink");
    await expect(category.locator('span[aria-hidden="true"] svg path').first()).toBeVisible();
    await expect(category).toBeFocused();

    const tags = page.getByRole("textbox", { name: "Tags", exact: true });
    await tags.fill("weekend,");
    await expect(
      page.getByRole("button", { name: "Remove tag weekend", exact: true }),
    ).toBeVisible();
    await expect(tags).toHaveValue("");
    await tags.fill("work");
    await tags.press("Enter");
    await expect(page.getByRole("button", { name: "Remove tag work", exact: true })).toBeVisible();
    await tags.press("Backspace");
    await expect(page.getByRole("button", { name: "Remove tag work", exact: true })).toHaveCount(0);
    await tags.press("Shift+Tab");
    const removeWeekend = page.getByRole("button", { name: "Remove tag weekend", exact: true });
    await expect(removeWeekend).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(removeWeekend).toHaveCount(0);
    await tags.fill("social, lunch");
    await expect(
      page.getByRole("button", { name: "Remove tag social", exact: true }),
    ).toBeVisible();
    await expect(tags).toHaveValue(" lunch");
    await page.getByLabel("Note", { exact: true }).fill(`${kind} tag test`);
    await page.getByRole("button", { name: submitLabel, exact: true }).click();
    await expect(page).toHaveURL(kind === "transaction" ? /\/transactions\?/ : /\/recurring$/);
    const rows = kind === "transaction" ? apiMock.transactions : apiMock.recurring;
    expect(rows.find((row) => row.note === `${kind} tag test`)).toMatchObject({
      categoryId: ids.food,
      accountId: null,
      amount: { value: 18.75, currency: { code: "USD", symbol: "$" } },
      tags: ["social", "lunch"],
    });
  });
}
