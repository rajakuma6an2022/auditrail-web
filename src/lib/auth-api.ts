// DAY 1 MOCK. Day 2 replaces this file with real calls to the Express API.
// Behaviour: waits 800ms, then succeeds. Emails starting with "fail" simulate a server error.
export async function requestMagicLink(email: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (email.toLowerCase().startsWith("fail")) {
    throw new Error("Could not send the sign-in link.");
  }
}