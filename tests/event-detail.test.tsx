import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));
const getEvent = vi.fn();
vi.mock("@/lib/events-api", async (orig) => ({
  ...(await orig<typeof import("@/lib/events-api")>()),
  getEvent: (...a: unknown[]) => getEvent(...a),
}));

import { EventDetail } from "@/app/events/[id]/event-detail";

const event = {
  id: "evt_9f81a2",
  tenantId: "tenant_payflow",
  createdAt: "2026-10-06T04:34:21.000Z",
  level: "ERROR" as const,
  service: "payments",
  actorId: "user_4821",
  action: "payment_failed",
  message: "Payment failed for customer during card authorization.",
  metadata: { paymentId: "pay_10492", amount: 1499, currency: "INR" },
};

beforeEach(() => {
  getEvent.mockReset();
});

describe("EventDetail", () => {
  it("shows the event, severity text and metadata", async () => {
    getEvent.mockResolvedValue(event);
    render(<EventDetail id="evt_9f81a2" />);
    expect(await screen.findByText(event.message)).toBeInTheDocument();
    expect(screen.getAllByText("ERROR").length).toBeGreaterThan(0);
    expect(screen.getByText("user_4821")).toBeInTheDocument();
    expect(screen.getByLabelText("Event metadata (JSON)")).toHaveTextContent('"paymentId": "pay_10492"');
    expect(screen.getByRole("button", { name: "Copy Event ID" })).toBeInTheDocument();
  });

  it("shows the loading state first", () => {
    getEvent.mockReturnValue(new Promise(() => {}));
    render(<EventDetail id="evt_1" />);
    expect(screen.getByRole("status", { name: "Loading event" })).toBeInTheDocument();
  });

  it("shows not found on 404", async () => {
    getEvent.mockRejectedValue(new ApiError(404, "EVENT_NOT_FOUND", "nope"));
    render(<EventDetail id="evt_x" />);
    expect(await screen.findByText("Event not found")).toBeInTheDocument();
  });

  it("shows unauthorized on 401", async () => {
    getEvent.mockRejectedValue(new ApiError(401, "UNAUTHENTICATED", "no"));
    render(<EventDetail id="evt_x" />);
    expect(await screen.findByText("You can't view this event")).toBeInTheDocument();
  });

  it("shows an error with retry on 500", async () => {
    getEvent.mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "boom"));
    render(<EventDetail id="evt_x" />);
    expect(await screen.findByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});