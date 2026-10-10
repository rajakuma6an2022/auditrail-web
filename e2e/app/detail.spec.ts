import { expect, test } from "@playwright/test";

test("shows what happened, when, where, who and the metadata", async ({ page }) => {
  await page.goto("/events/evt_9f81a2");
  await expect(page.getByRole("heading", { name: "Event Detail" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Event Detail");
  const info = page.getByRole("region", { name: "Event information" });
  await expect(info).toContainText("evt_9f81a2");
  await expect(info).toContainText("ERROR");
  await expect(info).toContainText("payments");
  await expect(info).toContainText("user_4821");
  await expect(info).toContainText("payment_failed");
  await expect(page.getByText("Payment failed for customer during card authorization.")).toBeVisible();
  await expect(page.getByLabel("Event metadata (JSON)")).toContainText('"reason": "card_declined"');
});

test("Copy Event ID copies the ID and confirms", async ({ page }) => {
  await page.goto("/events/evt_9f81a2");
  await page.getByRole("button", { name: "Copy Event ID" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("evt_9f81a2");
});

test("an unknown event shows not found", async ({ page }) => {
  await page.goto("/events/evt_does_not_exist");
  await expect(page.getByText("Event not found")).toBeVisible();
});

test("another tenant's event is not accessible (tenant isolation)", async ({ page }) => {
  await page.goto("/events/evt_acme_secret");
  await expect(page.getByText("Event not found")).toBeVisible();
  await expect(page.getByText("tenant acme secret")).toHaveCount(0);
});
