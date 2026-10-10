import { test } from "@playwright/test";
import { expectNoA11yViolations } from "../axe";

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
    });

    test("login page has no WCAG A/AA violations", async ({ page }) => {
      await page.goto("/login");
      await expectNoA11yViolations(page);
    });

    test("login validation state has no violations", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Send magic link" }).click();
      await expectNoA11yViolations(page);
    });

    test("404 page has no violations", async ({ page }) => {
      await page.goto("/definitely-not-a-page");
      await expectNoA11yViolations(page);
    });
  });
}
