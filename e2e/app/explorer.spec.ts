import { expect, test } from "@playwright/test";

const rows = (page: import("@playwright/test").Page) => page.locator("tbody tr");

test.beforeEach(async ({ page }) => {
  await page.goto("/events");
  await expect(page.getByRole("link", { name: "evt_9f81a2" })).toBeVisible();
});

test("renders the newest event first with severity shown as text", async ({ page }) => {
  await expect(rows(page)).toHaveCount(25);
  await expect(rows(page).first()).toContainText("evt_9f81a2");
  await expect(rows(page).first()).toContainText("ERROR");
  await expect(page.getByRole("columnheader")).toHaveCount(7);
});

test("Load more appends the next page without duplicates", async ({ page }) => {
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(rows(page)).toHaveCount(50);
  const ids = await rows(page).locator("td:first-child a").allTextContents();
  expect(new Set(ids).size).toBe(50);
});

test("severity filter shows only ERROR events and syncs to the URL", async ({ page }) => {
  await page.getByLabel("Level").selectOption("ERROR");
  await expect(page).toHaveURL(/level=ERROR/);
  await expect(rows(page)).toHaveCount(21);
  await expect(rows(page).filter({ hasNotText: "ERROR" })).toHaveCount(0);
  await expect(page.getByText(/end of results/)).toBeVisible();
});

test("search narrows results by actor", async ({ page }) => {
  await page.getByLabel("Search events").fill("user_4821");
  await expect(page).toHaveURL(/q=user_4821/);
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("evt_9f81a2");
});

test("no matches shows the empty state, and Clear filters restores the list", async ({ page }) => {
  await page.getByLabel("Search events").fill("zzzz-no-match");
  await expect(page.getByText("No events match your filters")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(rows(page)).toHaveCount(25);
  await expect(page.getByLabel("Search events")).toHaveValue("");
});

test("filters survive opening an event and going back", async ({ page }) => {
  await page.getByLabel("Level").selectOption("ERROR");
  await expect(rows(page)).toHaveCount(21);
  await rows(page).first().getByRole("link").click();
  await expect(page.getByRole("heading", { name: "Event Detail" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Events" }).click();
  await expect(page).toHaveURL(/level=ERROR/);
  await expect(rows(page)).toHaveCount(21);
});

test('pressing "/" focuses the search box', async ({ page }) => {
  await page.locator("body").press("/");
  await expect(page.getByLabel("Search events")).toBeFocused();
});

test("sign out returns to login and protects /events again", async ({ page }) => {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/events");
  await expect(page).toHaveURL(/\/login$/);
});
