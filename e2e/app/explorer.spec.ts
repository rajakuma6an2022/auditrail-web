import { expect, test, type Page } from "@playwright/test";

// Only real data rows (spacer rows are aria-hidden and have no aria-rowindex).
const rows = (page: Page) => page.locator("tbody tr[aria-rowindex]");
const footer = (page: Page) => page.getByRole("status").filter({ hasText: "Showing" });
// file top, rows/footer க்கு அப்புறம்
async function fillDate(page: Page, label: "From" | "To", value: string) {
  const input = page.getByLabel(label, { exact: true });
  await input.fill(value);
  await input.blur();
  await expect(input).toHaveValue(value);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/events");
  await expect(page.getByRole("link", { name: "evt_9f81a2" })).toBeVisible();
});

test("renders the newest event first with severity shown as text", async ({ page }) => {
  await expect(rows(page).first()).toContainText("evt_9f81a2");
  await expect(rows(page).first()).toContainText("ERROR");
  await expect(page.getByRole("columnheader")).toHaveCount(7);
});

test("infinite scroll loads every event exactly once and only renders the visible window", async ({ page }) => {
  const scroller = page.getByRole("region", { name: "Events table" });
  await expect(async () => {
    await scroller.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await expect(footer(page)).toContainText("end of results", { timeout: 1000 });
  }).toPass({ timeout: 20_000 });

  // 121 seeded events: a duplicate or a missing page would change this number.
  await expect(footer(page)).toContainText("Showing 121 events");
  // virtualization: 121 rows are loaded but only a small window is in the DOM
  expect(await rows(page).count()).toBeLessThan(60);
});

test("severity filter shows only ERROR events and syncs to the URL", async ({ page }) => {
  await page.getByLabel("Level").selectOption("ERROR");
  await expect(page).toHaveURL(/level=ERROR/);
  await expect(footer(page)).toContainText("Showing 21 events · end of results");
  await expect(rows(page).first()).toBeVisible();
  await expect(rows(page).filter({ hasNotText: "ERROR" })).toHaveCount(0);
});

test("search narrows results by actor", async ({ page }) => {
  await page.getByLabel("Search events").fill("user_4821");
  await expect(page).toHaveURL(/q=user_4821/);
  await expect(footer(page)).toContainText("Showing 1 event · end of results");
  await expect(rows(page).first()).toContainText("evt_9f81a2");
});

test("no matches shows the empty state, and Clear filters restores the list", async ({ page }) => {
  await page.getByLabel("Search events").fill("zzzz-no-match");
  await expect(page.getByText("No events match your filters")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(rows(page).first()).toBeVisible();
  await expect(page.getByLabel("Search events")).toHaveValue("");
});

test("filters survive opening an event and going back", async ({ page }) => {
  await page.getByLabel("Level").selectOption("ERROR");
  await expect(footer(page)).toContainText("Showing 21 events");
  await rows(page).first().getByRole("link").click();
  await expect(page.getByRole("heading", { name: "Event Detail" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Events" }).click();
  await expect(page).toHaveURL(/level=ERROR/);
  await expect(footer(page)).toContainText("Showing 21 events");
});

test("custom date range: a wide range keeps events, a far-future range shows none", async ({ page }) => {
  await page.getByLabel("Time range").selectOption("custom");
  await fillDate(page, "From", "2000-01-01T00:00");
  await fillDate(page, "To", "2099-12-31T00:00");
  await expect(rows(page).first()).toBeVisible();

  await fillDate(page, "From", "2098-01-01T00:00");
  await fillDate(page, "To", "2098-01-02T00:00");
  await expect(page).toHaveURL(/from=/);
  await expect(page).toHaveURL(/to=/);
  await expect(page.getByText("No events match your filters")).toBeVisible();
});

test("custom date range: start after end shows a validation error", async ({ page }) => {
  await page.getByLabel("Time range").selectOption("custom");
  await fillDate(page, "From", "2026-10-02T00:00");
  await fillDate(page, "To", "2026-10-01T00:00");
  await expect(page.getByRole("alert").filter({ hasText: "The start must be before the end." })).toBeVisible();
  await expect(page.getByText("Check the date range")).toBeVisible();
});

test('pressing "/" focuses the search box', async ({ page }) => {
  await page.locator("body").press("/");
  await expect(page.getByLabel("Search events")).toBeFocused();
});

test("sign out (from the account menu) returns to login and protects /events again", async ({ page }) => {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/events");
  await expect(page).toHaveURL(/\/login$/);
});

test("account menu shows the user, and Escape closes it and returns focus", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Account menu" });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Tenant: tenant_payflow")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Keyboard shortcuts" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test('pressing "?" opens the keyboard shortcuts dialog, and Escape closes it', async ({ page }) => {
  await page.locator("body").press("?");
  const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Back from an event restores the list scroll position", async ({ page }) => {
  const scroller = page.getByRole("region", { name: "Events table" });

  // Load every page first, so the list is tall enough to be scrolled deep.
  await expect(async () => {
    await scroller.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await expect(footer(page)).toContainText("end of results", { timeout: 1000 });
  }).toPass({ timeout: 20_000 });

  await scroller.evaluate((el) => el.scrollTo(0, 1200));
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(1000);

  // Native click: Playwright's own scroll-into-view would move the list before we leave it.
  await rows(page)
    .nth(12)
    .getByRole("link")
    .evaluate((el) => (el as HTMLAnchorElement).click());
  await expect(page.getByRole("heading", { name: "Event Detail" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Events" }).click();

  await expect(scroller).toBeVisible();
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop), { timeout: 10_000 }).toBeGreaterThan(1000);
});
