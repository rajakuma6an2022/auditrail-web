// These must match prisma/e2e-seed.ts in the API repo.
export const E2E_EMAIL = "e2e@payflow.test";
export const tokenFor = (n: number) => `e2e-test-token-${String(n).padStart(8, "0")}`;
export const EXPIRED_TOKEN = "e2e-test-token-expired-0001";
export const USED_TOKEN = "e2e-test-token-used-000001";
