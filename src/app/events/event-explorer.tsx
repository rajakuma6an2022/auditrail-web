"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatePanel } from "@/components/ui/state-panel";
import { isTyping } from "@/lib/dom";
import { CUSTOM_RANGE, RANGES, hasActiveFilters, rangeError, type Filters } from "@/lib/events-api";
import { useEventList, useFacets } from "@/lib/queries";
import { EventTable, EventTableSkeleton } from "./event-table";

const dateInputClass =
  "h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-fg transition-colors hover:border-fg-muted focus:border-ring";

export function EventExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Filters live in the URL so a filtered view can be bookmarked or pasted to a teammate.
  const filters: Filters = {
    q: params.get("q") ?? "",
    level: params.get("level") ?? "",
    service: params.get("service") ?? "",
    action: params.get("action") ?? "",
    range: params.get("range") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
  };
  const dateError = rangeError(filters);

  const [searchText, setSearchText] = useState(filters.q);
  const [resetKey, setResetKey] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const facets = useFacets().data;
  const list = useEventList(filters, !dateError);
  const events = list.data?.pages.flatMap((p) => p.data) ?? [];

  const setParams = useCallback(
    (updates: Partial<Record<keyof Filters, string>>) => {
      const next = new URLSearchParams(window.location.search);
      for (const [name, value] of Object.entries(updates)) {
        if (value) next.set(name, value);
        else next.delete(name);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  // "/" focuses search (unless already typing somewhere)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !isTyping(e.target) && !e.metaKey && !e.ctrlKey) {
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
    debounce.current = setTimeout(() => setParams({ q: value.trim() }), 300);
  }

  function clearFilters() {
    clearTimeout(debounce.current);
    setSearchText("");
    setResetKey((k) => k + 1);
    router.replace(pathname, { scroll: false });
  }

  function onRangeChange(value: string) {
    // switching away from "custom" drops the custom dates
    setParams({ range: value, ...(value === CUSTOM_RANGE ? {} : { from: "", to: "" }) });
  }

  const active = hasActiveFilters(filters);
  const toOptions = (values: string[] = []) => values.map((v) => ({ value: v, label: v }));
  const rangeOptions = [
    ...Object.entries(RANGES).map(([value, r]) => ({ value, label: r.label })),
    { value: CUSTOM_RANGE, label: "Custom range…" },
  ];

  let body: React.ReactNode;
  if (dateError) {
    body = (
      <StatePanel
        tone="error"
        title="Check the date range"
        description="Fix the start and end time above to see matching events."
      />
    );
  } else if (list.isPending) {
    body = <EventTableSkeleton />;
  } else if (list.isError && events.length === 0) {
    body = (
      <StatePanel
        tone="error"
        title="Couldn't load events"
        description="Something went wrong while fetching events. Check your connection and try again."
        action={
          <Button variant="secondary" onClick={() => void list.refetch()}>
            Retry
          </Button>
        }
      />
    );
  } else if (events.length === 0) {
    body = (
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
    );
  } else {
    body = (
      <EventTable
        key={params.toString()}
        events={events}
        scrollKey={params.toString()}
        hasNextPage={list.hasNextPage}
        isFetchingNextPage={list.isFetchingNextPage}
        nextPageFailed={list.isFetchNextPageError}
        fetchNextPage={() => void list.fetchNextPage()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Events</h1>
        <p className="mt-1 text-sm text-fg-secondary">
          Search and filter application events, then open one to inspect it.
        </p>
      </div>

      <div key={resetKey} className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
              onChange={(e) => setParams({ level: e.target.value })}
              options={toOptions(facets?.levels ?? ["INFO", "WARN", "ERROR"])}
            />
            <Select
              label="Service"
              placeholder="All services"
              value={filters.service}
              onChange={(e) => setParams({ service: e.target.value })}
              options={toOptions(facets?.services)}
            />
            <Select
              label="Action"
              placeholder="All actions"
              value={filters.action}
              onChange={(e) => setParams({ action: e.target.value })}
              options={toOptions(facets?.actions)}
            />
            <Select
              label="Time range"
              placeholder="All time"
              value={filters.range}
              onChange={(e) => onRangeChange(e.target.value)}
              options={rangeOptions}
            />
          </div>
          {active && (
            <Button variant="ghost" onClick={clearFilters} className="self-start lg:self-auto">
              Clear filters
            </Button>
          )}
        </div>

        {filters.range === CUSTOM_RANGE && (
          <fieldset className="flex flex-wrap items-start gap-3">
            <legend className="sr-only">Custom time range</legend>
            <label className="flex flex-col gap-1 text-xs font-medium text-fg-secondary">
              From
              <input
                type="datetime-local"
                value={filters.from}
                onChange={(e) => setParams({ from: e.target.value })}
                className={dateInputClass}
                aria-invalid={dateError ? true : undefined}
                aria-describedby={dateError ? "range-error" : undefined}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-fg-secondary">
              To
              <input
                type="datetime-local"
                value={filters.to}
                onChange={(e) => setParams({ to: e.target.value })}
                className={dateInputClass}
                aria-invalid={dateError ? true : undefined}
                aria-describedby={dateError ? "range-error" : undefined}
              />
            </label>
            {dateError && (
              <p id="range-error" role="alert" className="self-end pb-2 text-xs text-error">
                {dateError}
              </p>
            )}
          </fieldset>
        )}
      </div>

      <section aria-label="Event results" className="overflow-hidden rounded-lg border border-border bg-surface">
        {body}

        {!dateError && events.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5 text-xs text-fg-secondary">
            <span role="status">
              Showing {events.length} event{events.length === 1 ? "" : "s"}
              {list.hasNextPage ? (list.isFetchingNextPage ? " · loading more…" : "") : " · end of results"}
            </span>
            {list.isFetchNextPageError && (
              <div className="flex items-center gap-3">
                <span role="alert" className="text-error">
                  Couldn&apos;t load more.
                </span>
                <Button variant="secondary" onClick={() => void list.fetchNextPage()}>
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
