import { api } from "./api";

export type User = { id: string; email: string; name: string; tenantId: string };

export function requestMagicLink(email: string) {
  return api<{ message: string }>("/api/v1/auth/magic-link", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyMagicLink(token: string) {
  return api<{ user: User }>("/api/v1/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function fetchMe() {
  return api<{ user: User }>("/api/v1/auth/me");
}

export function logout() {
  return api<void>("/api/v1/auth/logout", { method: "POST" });
}