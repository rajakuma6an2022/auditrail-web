import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithClient } from "./utils";

const replace = vi.fn();
const router = { replace, push: vi.fn() }; // stable identity, like the real Next router
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/events",
  useSearchParams: () => new URLSearchParams(search),
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
vi.mock("@/lib/events-api", async (orig) => ({
  ...(await orig<typeof import("@/lib/events-api")>()),
  listEvents: (...a: unknown[]) => listEvents(...a),
  getFacets: (...a: unknown[]) => getFacets(...a),
}));

import { EventExplorer } from "@/app/events/event-explorer";
import { clearScroll, readScroll, saveScroll } from "@/lib/scroll-memory";

const row = (n: number) => ({
  id: `evt_${n}`,
  tenantId: "t",
  createdAt: "2026-10-06T04:34:21.000Z",
  level: "WARN" as const,
  service: "orders",
  actorId: "user_1",
  action: "order_cancelled",
  message: `Order cancelled ${n}`,
  metadata: {},
});
const rows = (from: number, count: number) => Array.from({ length: count }, (_, i) => row(from + i));

beforeEach(() => {
  clearScroll();
  vi.clearAllMocks();
  search = "";
  getFacets.mockResolvedValue({
    levels: ["INFO", "WARN", "ERROR"],
    services: ["orders"],
    actions: ["order_cancelled"],
  });
});

describe("EventExplorer", () => {
  it("renders rows with text severity and links to detail", async () => {
    listEvents.mockResolvedValue({ data: [row(1), row(2)], nextCursor: null });
    renderWithClient(<EventExplorer />);
    expect(await screen.findByText("Order cancelled 1")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getAllByText("WARN")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "evt_1" })).toHaveAttribute("href", "/events/evt_1");
    expect(screen.getByText(/Showing 2 events · end of results/)).toBeInTheDocument();
  });

  it("shows the empty state with a clear action when filters match nothing", async () => {
    search = "level=ERROR";
    listEvents.mockResolvedValue({ data: [], nextCursor: null });
    renderWithClient(<EventExplorer />);
    expect(await screen.findByText("No events match your filters")).toBeInTheDocument();
  });

  it("shows an error state and retries", async () => {
    listEvents.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce({ data: [row(1)], nextCursor: null });
    const user = userEvent.setup();
    renderWithClient(<EventExplorer />);
    await user.click(await screen.findByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Order cancelled 1")).toBeInTheDocument();
  });

  it("automatically loads the next page when the end of the list is in view (infinite scroll)", async () => {
    listEvents
      .mockResolvedValueOnce({ data: rows(1, 5), nextCursor: "CUR" })
      .mockResolvedValueOnce({ data: rows(6, 5), nextCursor: null });
    renderWithClient(<EventExplorer />);
    expect(await screen.findByText(/Showing 10 events · end of results/)).toBeInTheDocument();
    expect(listEvents).toHaveBeenCalledTimes(2);
    expect(listEvents).toHaveBeenLastCalledWith(expect.anything(), "CUR", expect.anything());
    expect(screen.getByText("Order cancelled 1")).toBeInTheDocument();
    expect(screen.getByText("Order cancelled 10")).toBeInTheDocument();
  });

  it("does not fetch again when there is no next page", async () => {
    listEvents.mockResolvedValue({ data: rows(1, 3), nextCursor: null });
    renderWithClient(<EventExplorer />);
    await screen.findByText(/end of results/);
    expect(listEvents).toHaveBeenCalledTimes(1);
  });

  it("only renders the visible window of a very long list (virtualization)", async () => {
    listEvents.mockResolvedValue({ data: rows(1, 2000), nextCursor: null });
    renderWithClient(<EventExplorer />);
    expect(await screen.findByText(/Showing 2000 events/)).toBeInTheDocument();
    const rendered = document.querySelectorAll("tbody tr[aria-rowindex]").length;
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(60);
  });

  it("shows a retry for a failed next page and stops auto-fetching", async () => {
    listEvents.mockResolvedValueOnce({ data: rows(1, 5), nextCursor: "CUR" }).mockRejectedValueOnce(new Error("boom"));
    renderWithClient(<EventExplorer />);
    expect(await screen.findByText("Couldn't load more.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Retry" }).length).toBeGreaterThan(0);
    expect(listEvents).toHaveBeenCalledTimes(2);
  });

  it("writes a selected filter to the URL", async () => {
    listEvents.mockResolvedValue({ data: [row(1)], nextCursor: null });
    const user = userEvent.setup();
    renderWithClient(<EventExplorer />);
    await screen.findByText("Order cancelled 1");
    await user.selectOptions(screen.getByLabelText("Level"), "ERROR");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/events?level=ERROR", { scroll: false }));
  });

  it("choosing Custom range shows from/to inputs", async () => {
    search = "range=custom";
    listEvents.mockResolvedValue({ data: [row(1)], nextCursor: null });
    renderWithClient(<EventExplorer />);
    expect(await screen.findByLabelText("From")).toHaveAttribute("type", "datetime-local");
    expect(screen.getByLabelText("To")).toBeInTheDocument();
  });

  it("an inverted custom range shows an error and does not call the API", async () => {
    search = "range=custom&from=2026-10-02T00:00&to=2026-10-01T00:00";
    renderWithClient(<EventExplorer />);
    expect(await screen.findByText("The start must be before the end.")).toBeInTheDocument();
    expect(screen.getByText("Check the date range")).toBeInTheDocument();
    expect(listEvents).not.toHaveBeenCalled();
  });

  it("restores the saved scroll offset when the list is shown again (Back from an event)", async () => {
    saveScroll("", 300);
    listEvents.mockResolvedValue({ data: rows(1, 50), nextCursor: null });
    renderWithClient(<EventExplorer />);
    const region = await screen.findByRole("region", { name: "Events table" });
    expect(region.scrollTop).toBe(300);
  });

  it("remembers the scroll offset as the user scrolls", async () => {
    listEvents.mockResolvedValue({ data: rows(1, 50), nextCursor: null });
    renderWithClient(<EventExplorer />);
    const region = await screen.findByRole("region", { name: "Events table" });
    fireEvent.scroll(region, { target: { scrollTop: 120 } });
    expect(readScroll("")).toBe(120);
  });

  it("renders the rows around a deep saved offset on the first render (virtualizer initialOffset)", async () => {
    saveScroll("", 2000);
    listEvents.mockResolvedValue({ data: rows(1, 500), nextCursor: null });
    renderWithClient(<EventExplorer />);
    const region = await screen.findByRole("region", { name: "Events table" });
    const firstRendered = Number(document.querySelector("tbody tr[aria-rowindex]")!.getAttribute("aria-rowindex"));
    expect(firstRendered).toBeGreaterThan(20); // not starting from the top
    expect(region.scrollTop).toBe(2000);
  });
});
