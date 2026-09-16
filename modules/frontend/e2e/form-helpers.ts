import { expect, type Page } from "@playwright/test";

export async function chooseCategory(page: Page, name: string) {
  await page.getByRole("button", { name: "Category", exact: true }).click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
}

export async function expectAmountCurrency(page: Page, symbol: string, code: string) {
  const amount = page.getByRole("textbox", { name: "Amount", exact: true });
  await expect(amount).toHaveAccessibleDescription(new RegExp(`Amount in ${code}`));
  await expect(page.locator('[data-slot="currency-symbol"]')).toHaveText(symbol);
  await expect(page.getByRole("combobox", { name: "Currency", exact: true })).toHaveCount(0);
}
