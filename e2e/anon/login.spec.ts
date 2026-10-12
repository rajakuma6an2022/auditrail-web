import { expect, test } from "@playwright/test";
import { EXPIRED_TOKEN, USED_TOKEN, tokenFor } from "../tokens";

test("signed-out visitors are redirected from /events to /login", async ({ page }) => {
  await page.goto("/events");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in to Auditrail" })).toBeVisible();
});

test("shows validation errors for empty and invalid email", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Send magic link" }).click();
  await expect(page.getByText("Enter your email address.")).toBeVisible();

  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByRole("button", { name: "Send magic link" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
});

// test("requesting a link shows the confirmation state", async ({ page }) => {
//   await page.goto("/login");
//   await page.getByLabel("Email address").fill(E2E_EMAIL);
//   await page.getByRole("button", { name: "Send magic link" }).click();
//   await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
// });

test("requesting a link shows the confirmation state", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("other@acme.test");
  await page.getByRole("button", { name: "Send magic link" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
});

test("a valid magic link signs the user in", async ({ page }, testInfo) => {
  page.on("response", async (response) => {
    if (response.url().includes("/api/v1/auth/verify")) {
      console.log("Verify status:", response.status());
      console.log("Verify URL:", response.url());
      console.log("Verify body:", await response.text().catch(() => ""));
    }
  });

  await page.goto(`/auth/verify?token=${tokenFor(4 + testInfo.retry)}`);
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole("heading", { name: "Events", exact: true })).toBeVisible();
});

for (const [name, token] of [
  ["expired", EXPIRED_TOKEN],
  ["already used", USED_TOKEN],
  ["unknown", "e2e-test-token-does-not-exist"],
] as const) {
  test(`a ${name} link shows an error and lets the user retry`, async ({ page }) => {
    await page.goto(`/auth/verify?token=${token}`);
    await expect(page.getByRole("heading", { name: "Couldn't sign you in" })).toBeVisible();
    await page.getByRole("link", { name: "Request a new link" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("unknown routes show the 404 screen", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("theme toggle switches to dark and persists after reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
