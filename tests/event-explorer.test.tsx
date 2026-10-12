import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

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
function renderExplorer() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(<EventExplorer />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

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

beforeEach(() => {
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
    renderExplorer();
    expect(await screen.findByText("Order cancelled 1")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getAllByText("WARN")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "evt_1" })).toHaveAttribute("href", "/events/evt_1");
    expect(screen.getByText(/end of results/)).toBeInTheDocument();
  });

  it("shows the empty state with a clear action when filters match nothing", async () => {
    search = "level=ERROR";
    listEvents.mockResolvedValue({ data: [], nextCursor: null });
    renderExplorer();
    expect(await screen.findByText("No events match your filters")).toBeInTheDocument();
  });

  it("shows an error state and retries", async () => {
    listEvents.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce({ data: [row(1)], nextCursor: null });
    const user = userEvent.setup();
    renderExplorer();
    await user.click(await screen.findByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Order cancelled 1")).toBeInTheDocument();
  });

  it("loads more rows using the cursor", async () => {
    listEvents
      .mockResolvedValueOnce({ data: [row(1)], nextCursor: "CUR" })
      .mockResolvedValueOnce({ data: [row(2)], nextCursor: null });
    const user = userEvent.setup();
    renderExplorer();
    await user.click(await screen.findByRole("button", { name: "Load more" }));
    expect(await screen.findByText("Order cancelled 2")).toBeInTheDocument();
    expect(listEvents).toHaveBeenLastCalledWith(expect.anything(), "CUR", expect.any(AbortSignal));
    expect(screen.getByText("Order cancelled 1")).toBeInTheDocument();
  });

  it("writes a selected filter to the URL", async () => {
    listEvents.mockResolvedValue({ data: [row(1)], nextCursor: null });
    const user = userEvent.setup();
    renderExplorer();
    await screen.findByText("Order cancelled 1");
    await user.selectOptions(screen.getByLabelText("Level"), "ERROR");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/events?level=ERROR", { scroll: false }));
  });

  it("ignores a stale Load More response after filters change", async () => {
    let resolveLoadMore!: (value: { data: ReturnType<typeof row>[]; nextCursor: string | null }) => void;

    const pendingLoadMore = new Promise<{
      data: ReturnType<typeof row>[];
      nextCursor: string | null;
    }>((resolve) => {
      resolveLoadMore = resolve;
    });

    listEvents
      .mockResolvedValueOnce({
        data: [row(1)],
        nextCursor: "CUR",
      })
      .mockImplementationOnce(() => pendingLoadMore)
      .mockResolvedValueOnce({
        data: [row(3)],
        nextCursor: null,
      });

    const user = userEvent.setup();
    const { rerender } = renderExplorer();

    expect(await screen.findByText("Order cancelled 1")).toBeInTheDocument();

    // Start Load More, but keep its response pending.
    await user.click(screen.getByRole("button", { name: "Load more" }));

    await waitFor(() => {
      expect(listEvents).toHaveBeenCalledTimes(2);
    });

    const loadMoreSignal = listEvents.mock.calls[1][2] as AbortSignal;

    // Simulate Next.js updating the URL after the filter changes.
    await user.selectOptions(screen.getByLabelText("Level"), "ERROR");
    search = "level=ERROR";
    rerender(<EventExplorer />);

    // The new filter's first page should replace the old page.
    expect(await screen.findByText("Order cancelled 3")).toBeInTheDocument();

    // The previous pagination request must have been cancelled.
    expect(loadMoreSignal.aborted).toBe(true);

    // Resolve the old request after the new filtered results have arrived.
    await act(async () => {
      resolveLoadMore({
        data: [row(2)],
        nextCursor: null,
      });
      await pendingLoadMore;
    });

    expect(screen.getByText("Order cancelled 3")).toBeInTheDocument();
    expect(screen.queryByText("Order cancelled 2")).not.toBeInTheDocument();
  });
});
