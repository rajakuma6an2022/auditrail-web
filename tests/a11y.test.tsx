import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const router = { replace, push: vi.fn(), back: vi.fn() }; // stable identity, like the real Next router
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/events",
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const listEvents = vi.fn();
const getFacets = vi.fn();
const getEvent = vi.fn();
vi.mock("@/lib/events-api", async (orig) => ({
  ...(await orig<typeof import("@/lib/events-api")>()),
  listEvents: (...a: unknown[]) => listEvents(...a),
  getFacets: (...a: unknown[]) => getFacets(...a),
  getEvent: (...a: unknown[]) => getEvent(...a),
}));
vi.mock("@/lib/auth-api", () => ({
  requestMagicLink: vi.fn().mockResolvedValue({ message: "ok" }),
  logout: vi.fn(),
}));

import { LoginForm } from "@/app/login/login-form";
import { EventExplorer } from "@/app/events/event-explorer";
import { EventDetail } from "@/app/events/[id]/event-detail";
import NotFound from "@/app/not-found";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { ApiError } from "@/lib/api";

// Colour contrast needs real layout/colours (jsdom has none): covered by tests/contrast.test.ts and the Playwright axe run.
// "region" is skipped because we render components in isolation, without the page landmarks.
async function violations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.help} -> ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

const event = {
  id: "evt_1",
  tenantId: "t",
  createdAt: "2026-10-06T04:34:21.000Z",
  level: "ERROR" as const,
  service: "payments",
  actorId: "user_1",
  action: "payment_failed",
  message: "Payment failed",
  metadata: { a: 1 },
};

describe("axe (jsdom)", () => {
  it("login: default, invalid and sent states", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginForm />);
    expect(await violations(container)).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Send magic link" }));
    await screen.findByText("Enter your email address.");
    expect(await violations(container)).toEqual([]);

    await user.type(screen.getByLabelText("Email address"), "a@b.com");
    await user.click(screen.getByRole("button", { name: "Send magic link" }));
    await screen.findByText("Check your email");
    expect(await violations(container)).toEqual([]);
  });

  it("explorer: results, labelled filters, table headers", async () => {
    getFacets.mockResolvedValue({
      levels: ["INFO", "WARN", "ERROR"],
      services: ["payments"],
      actions: ["payment_failed"],
    });
    listEvents.mockResolvedValue({ data: [event], nextCursor: "c" });
    const { container } = render(<EventExplorer />);
    await screen.findByText("Payment failed");
    expect(await violations(container)).toEqual([]);
    for (const name of ["Search events", "Level", "Service", "Action", "Time range"]) {
      expect(screen.getByLabelText(name)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("columnheader").length).toBe(7);
  });

  it("explorer: error state", async () => {
    getFacets.mockResolvedValue({ levels: [], services: [], actions: [] });
    listEvents.mockRejectedValue(new Error("down"));
    const { container } = render(<EventExplorer />);
    await screen.findByRole("button", { name: "Retry" });
    expect(await violations(container)).toEqual([]);
  });

  it("detail: found and not-found states", async () => {
    getEvent.mockResolvedValue(event);
    const found = render(<EventDetail id="evt_1" />);
    await screen.findByText("Event information");
    expect(await violations(found.container)).toEqual([]);
    found.unmount();

    getEvent.mockRejectedValue(new ApiError(404, "EVENT_NOT_FOUND", "x"));
    const missing = render(<EventDetail id="evt_x" />);
    await waitFor(() => expect(screen.getByText("Event not found")).toBeInTheDocument());
    expect(await violations(missing.container)).toEqual([]);
  });

  it("404 screen", async () => {
    const { container } = render(<NotFound />);
    expect(await violations(container)).toEqual([]);
  });

  it.each(["INFO", "WARN", "ERROR"] as const)("severity %s is conveyed by text, not colour alone", (level) => {
    render(<SeverityBadge level={level} />);
    expect(screen.getByText(level)).toBeVisible();
  });
});
