import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const replace = vi.fn();
let tokenParam: string | null = "abc";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: () => tokenParam }),
}));

const verify = vi.fn();
vi.mock("@/lib/auth-api", () => ({ verifyMagicLink: (t: string) => verify(t) }));

import { VerifyClient } from "@/app/auth/verify/verify-client";

beforeEach(() => {
  vi.clearAllMocks();
  tokenParam = "abc";
});

describe("VerifyClient", () => {
  it("redirects to /events when the token is valid", async () => {
    verify.mockResolvedValue({ user: {} });
    render(<VerifyClient />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/events"));
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it("shows an error when the token is rejected", async () => {
    verify.mockRejectedValue({ status: 401 });
    render(<VerifyClient />);
    expect(await screen.findByRole("alert")).toHaveTextContent("invalid or has expired");
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows an error when there is no token and never calls the API", () => {
    tokenParam = null;
    render(<VerifyClient />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(verify).not.toHaveBeenCalled();
  });
});