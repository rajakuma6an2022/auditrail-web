import { expect, test as setup } from "@playwright/test";
import { tokenFor } from "./tokens";

// Signs in once with a pre-seeded single-use magic-link token and saves the session for the "app" project.
setup("sign in with a magic-link token", async ({ page }, testInfo) => {
  await page.goto(`/auth/verify?token=${tokenFor(1 + testInfo.retry)}`);
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole("link", { name: "evt_9f81a2" })).toBeVisible();
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
