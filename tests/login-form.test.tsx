import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { LoginForm, validateEmail } from "@/app/login/login-form";
import { SeverityBadge } from "@/components/ui/severity-badge";

vi.mock("@/lib/auth-api", () => ({
  requestMagicLink: vi.fn(async (email: string) => {
    if (email.startsWith("fail")) throw new Error("boom");
    return { message: "ok" };
  }),
}));

describe("validateEmail", () => {
  it("rejects empty", () => expect(validateEmail("  ")).toBe("Enter your email address."));
  it("rejects invalid", () => expect(validateEmail("abc")).toBe("Enter a valid email address."));
  it("accepts valid", () => expect(validateEmail("a@b.com")).toBeNull());
});

describe("LoginForm", () => {
  it("shows an error for an invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("Email address"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send magic link" }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the success state for a valid email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("Email address"), "dev@payflow.test");
    await user.click(screen.getByRole("button", { name: "Send magic link" }));
    expect(await screen.findByText("Check your email", {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it("shows the error state when sending fails", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("Email address"), "fail@payflow.test");
    await user.click(screen.getByRole("button", { name: "Send magic link" }));
    expect(await screen.findByRole("alert", {}, { timeout: 3000 })).toBeInTheDocument();
  });
});

describe("SeverityBadge", () => {
  it.each(["INFO", "WARN", "ERROR"] as const)("renders text for %s", (level) => {
    render(<SeverityBadge level={level} />);
    expect(screen.getByText(level)).toBeInTheDocument();
  });
});
