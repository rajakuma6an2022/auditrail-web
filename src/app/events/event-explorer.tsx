"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatePanel } from "@/components/ui/state-panel";
import { RANGES, getFacets, hasActiveFilters, listEvents, statusOf, type Filters } from "@/lib/events-api";
import { EventTable } from "./event-table";

export function EventExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters: Filters = {
    q: params.get("q") ?? "",
    level: params.get("level") ?? "",
    service: params.get("service") ?? "",
    action: params.get("action") ?? "",
    range: params.get("range") ?? "",
  };

  const [searchText, setSearchText] = useState(filters.q);
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [reloadTick, setReloadTick] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const facetsQuery = useQuery({
    queryKey: ["event-facets"],
    queryFn: ({ signal }) => getFacets(signal),
  });

  const eventsQuery = useInfiniteQuery({
    queryKey: ["events", filters, reloadTick],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => listEvents(filters, pageParam, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  useEffect(() => {
    if (statusOf(eventsQuery.error) === 401) {
      router.replace("/login");
    }
  }, [eventsQuery.error, router]);

  const setParam = useCallback(
    (name: keyof Filters, value: string) => {
      const next = new URLSearchParams(window.location.search);
      if (value) next.set(name, value);
      else next.delete(name);

      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(debounce.current);
    };
  }, []);

  function onSearchChange(value: string) {
    setSearchText(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setParam("q", value.trim()), 300);
  }

  function clearFilters() {
    clearTimeout(debounce.current);
    setSearchText("");
    setSearchResetKey((key) => key + 1);
    router.replace(pathname, { scroll: false });
  }

  const pages = eventsQuery.data?.pages ?? [];
  const rows = pages.flatMap((page) => page.data);
  const nextCursor = pages.at(-1)?.nextCursor ?? null;
  const loading = eventsQuery.isPending;
  const active = hasActiveFilters(filters);
  const facets = facetsQuery.data;

  const toOptions = (values: string[] = []) => values.map((value) => ({ value, label: value }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Events</h1>
        <p className="mt-1 text-sm text-fg-secondary">
          Search and filter application events, then open one to inspect it.
        </p>
      </div>

      <div key={searchResetKey} className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="lg:w-80">
          <SearchInput
            ref={searchRef}
            label="Search events"
            placeholder="Event ID, actor or message"
            value={searchText}
            onChange={onSearchChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
          <Select
            label="Level"
            placeholder="All levels"
            value={filters.level}
            onChange={(e) => setParam("level", e.target.value)}
            options={toOptions(facets?.levels ?? ["INFO", "WARN", "ERROR"])}
          />
          <Select
            label="Service"
            placeholder="All services"
            value={filters.service}
            onChange={(e) => setParam("service", e.target.value)}
            options={toOptions(facets?.services)}
          />
          <Select
            label="Action"
            placeholder="All actions"
            value={filters.action}
            onChange={(e) => setParam("action", e.target.value)}
            options={toOptions(facets?.actions)}
          />
          <Select
            label="Time range"
            placeholder="All time"
            value={filters.range}
            onChange={(e) => setParam("range", e.target.value)}
            options={Object.entries(RANGES).map(([value, range]) => ({
              value,
              label: range.label,
            }))}
          />
        </div>

        {active && (
          <Button variant="ghost" onClick={clearFilters} className="self-start lg:self-auto">
            Clear filters
          </Button>
        )}
      </div>

      <section aria-label="Event results" className="overflow-hidden rounded-lg border border-border bg-surface">
        {eventsQuery.isError && !eventsQuery.data ? (
          <StatePanel
            tone="error"
            title="Couldn't load events"
            description="Something went wrong while fetching events. Check your connection and try again."
            action={
              <Button variant="secondary" onClick={() => setReloadTick((tick) => tick + 1)}>
                Retry
              </Button>
            }
          />
        ) : !loading && rows.length === 0 && eventsQuery.data ? (
          <StatePanel
            title={active ? "No events match your filters" : "No events yet"}
            description={
              active
                ? "Try a different search term or remove some filters."
                : "Events will appear here once your application starts sending them."
            }
            action={
              active ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <EventTable events={rows} loading={loading} />
        )}

        {!loading && eventsQuery.data && rows.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5 text-xs text-fg-secondary">
            <span aria-live="polite">
              Showing {rows.length} event{rows.length === 1 ? "" : "s"}
              {nextCursor ? "" : " · end of results"}
            </span>

            <div className="flex items-center gap-3">
              {eventsQuery.isFetchNextPageError && (
                <span role="alert" className="text-error">
                  Couldn&apos;t load more.
                </span>
              )}

              {nextCursor && (
                <Button
                  variant="secondary"
                  onClick={() => void eventsQuery.fetchNextPage()}
                  loading={eventsQuery.isFetchingNextPage}
                  loadingText="Loading…"
                >
                  Load more
                </Button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
