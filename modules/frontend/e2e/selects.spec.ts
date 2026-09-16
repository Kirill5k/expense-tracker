import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import { chooseCategory, expectAmountCurrency } from "./form-helpers";

for (const kind of ["transaction", "recurring"] as const) {
  test(`capture ${kind} form and category icons on desktop and phone in both themes`, async ({
    page,
    apiMock,
  }, testInfo) => {
    const path = kind === "transaction" ? "/transactions/new" : "/recurring/new";
    const title = kind === "transaction" ? "Add transaction" : "Make it recurring";
    for (const theme of ["light", "dark"] as const) {
      apiMock.user.settings.darkMode = theme === "dark";
      for (const [device, viewport] of [
        ["desktop", { width: 1440, height: 1000 }],
        ["phone", { width: 390, height: 844 }],
      ] as const) {
        await page.setViewportSize(viewport);
        await page.goto(path);
        await page.getByLabel("Account", { exact: true }).selectOption({ label: "No account" });
        await expectAmountCurrency(page, "£", "GBP");
        await page.getByLabel("Amount", { exact: true }).fill("24.50");
        await chooseCategory(page, "Food & drink");
        await page.getByLabel("Tags", { exact: true }).fill("weekend, essentials,");
        await expect(page.locator("html")).toHaveClass(new RegExp(theme));
        await page.getByRole("heading", { name: title, exact: true }).click();
        const layout = await page.evaluate(() => {
          const form = document.querySelector("form")!;
          const style = getComputedStyle(form);
          return {
            viewport: window.innerWidth,
            width: document.documentElement.scrollWidth,
            contentWidth:
              form.getBoundingClientRect().width -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight) -
              parseFloat(style.borderLeftWidth) -
              parseFloat(style.borderRightWidth),
            fields: [
              ...document.querySelectorAll(
                "form > fieldset > *, [data-slot='amount-input'], form input",
              ),
            ].map((element) => ({
              element: element.tagName,
              className: element.className,
              width: element.getBoundingClientRect().width,
            })),
          };
        });
        expect(layout.width, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport);
        for (const field of layout.fields) {
          expect(field.width, JSON.stringify(field)).toBeLessThanOrEqual(layout.contentWidth + 1);
        }
        await page.screenshot({
          path: testInfo.outputPath(`${kind}-form-${theme}-${device}.png`),
          animations: "disabled",
          fullPage: true,
          scale: "css",
        });
        await page.getByRole("button", { name: "Category", exact: true }).click();
        await expect(
          page.getByRole("menuitemradio", { name: "Food & drink", exact: true }),
        ).toBeVisible();
        await page.screenshot({
          path: testInfo.outputPath(`${kind}-categories-${theme}-${device}.png`),
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
        await page.keyboard.press("Escape");
      }
    }
  });
}
