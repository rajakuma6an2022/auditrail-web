import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "../axe";

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
    });

    test("event explorer has no WCAG A/AA violations", async ({ page }) => {
      await page.goto("/events");
      await expect(page.getByRole("link", { name: "evt_9f81a2" })).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test("explorer empty state has no violations", async ({ page }) => {
      await page.goto("/events?q=zzzz-no-match");
      await expect(page.getByText("No events match your filters")).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test("event detail has no violations", async ({ page }) => {
      await page.goto("/events/evt_9f81a2");
      await expect(page.getByText("Event information")).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test("event not found state has no violations", async ({ page }) => {
      await page.goto("/events/evt_does_not_exist");
      await expect(page.getByText("Event not found")).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test("account menu (open) has no violations", async ({ page }) => {
      await page.goto("/events");
      await expect(page.getByRole("link", { name: "evt_9f81a2" })).toBeVisible();
      await page.getByRole("button", { name: "Account menu" }).click();
      await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test("keyboard shortcuts dialog (open) has no violations", async ({ page }) => {
      await page.goto("/events");
      await expect(page.getByRole("link", { name: "evt_9f81a2" })).toBeVisible();
      await page.locator("body").press("?");
      await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
      await expectNoA11yViolations(page);
    });
  });
}
