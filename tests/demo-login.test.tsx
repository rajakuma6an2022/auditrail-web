import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const router = { replace, push: vi.fn() }; // stable identity, like the real Next router
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const getAuthConfig = vi.fn();
const demoLogin = vi.fn();
vi.mock("@/lib/auth-api", () => ({
  getAuthConfig: () => getAuthConfig(),
  demoLogin: () => demoLogin(),
}));

import { DemoLogin } from "@/app/login/demo-login";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DemoLogin", () => {
  it("renders nothing when the demo is disabled", async () => {
    getAuthConfig.mockResolvedValue({ demoEnabled: false });
    const { container } = render(<DemoLogin />);
    await waitFor(() => expect(getAuthConfig).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the config request fails (normal login still works)", async () => {
    getAuthConfig.mockRejectedValue(new Error("down"));
    const { container } = render(<DemoLogin />);
    await waitFor(() => expect(getAuthConfig).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("signs in and goes to /events", async () => {
    getAuthConfig.mockResolvedValue({ demoEnabled: true });
    demoLogin.mockResolvedValue({ user: {} });
    const user = userEvent.setup();
    render(<DemoLogin />);
    await user.click(await screen.findByRole("button", { name: "Try the demo" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/events"));
  });

  it("shows an error and re-enables the button when the demo fails", async () => {
    getAuthConfig.mockResolvedValue({ demoEnabled: true });
    demoLogin.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<DemoLogin />);
    await user.click(await screen.findByRole("button", { name: "Try the demo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't start the demo");
    expect(screen.getByRole("button", { name: "Try the demo" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    getAuthConfig.mockResolvedValue({ demoEnabled: true });
    const { container } = render(<DemoLogin />);
    await screen.findByRole("button", { name: "Try the demo" });
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
});
