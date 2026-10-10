"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatePanel } from "@/components/ui/state-panel";
import {
  RANGES,
  getFacets,
  hasActiveFilters,
  isAborted,
  listEvents,
  statusOf,
  type AuditEvent,
  type Facets,
  type Filters,
} from "@/lib/events-api";
import { EventTable } from "./event-table";

type Page = { key: string; rows: AuditEvent[]; nextCursor: string | null; error: string | null };

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
  };
  const filterKey = params.toString();

  const [searchText, setSearchText] = useState(filters.q);
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setParam = useCallback(
    (name: keyof Filters, value: string) => {
      const next = new URLSearchParams(window.location.search);
      if (value) next.set(name, value);
      else next.delete(name);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  // facets (dropdown options)
  useEffect(() => {
    const ctrl = new AbortController();
    getFacets(ctrl.signal)
      .then(setFacets)
      .catch(() => {
        /* dropdowns simply stay empty; the list still works */
      });
    return () => ctrl.abort();
  }, []);

  // first page whenever filters change (or Retry is pressed)
  const requestKey = `${filterKey}#${reloadTick}`;
  useEffect(() => {
    const ctrl = new AbortController();
    listEvents(filters, undefined, ctrl.signal)
      .then((r) => setPage({ key: requestKey, rows: r.data, nextCursor: r.nextCursor, error: null }))
      .catch((e: unknown) => {
        if (isAborted(e)) return;
        if (statusOf(e) === 401) {
          router.replace("/login");
          return;
        }
        setPage({ key: requestKey, rows: [], nextCursor: null, error: "Couldn't load events." });
      });
    return () => ctrl.abort();
    // `filters` is derived from filterKey, so filterKey is the real dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, reloadTick, router]);

  // "/" focuses search (unless already typing somewhere)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const typing =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
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
    setSearchResetKey((k) => k + 1);
    router.replace(pathname, { scroll: false });
  }

  async function loadMore() {
    if (!page?.nextCursor) return;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const r = await listEvents(filters, page.nextCursor);
      setPage((p) => (p ? { ...p, rows: [...p.rows, ...r.data], nextCursor: r.nextCursor } : p));
    } catch (e) {
      if (statusOf(e) === 401) router.replace("/login");
      else setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const loading = page === null || page.key !== requestKey;
  const active = hasActiveFilters(filters);
  const toOptions = (values: string[] = []) => values.map((v) => ({ value: v, label: v }));

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
            options={Object.entries(RANGES).map(([value, r]) => ({ value, label: r.label }))}
          />
        </div>
        {active && (
          <Button variant="ghost" onClick={clearFilters} className="self-start lg:self-auto">
            Clear filters
          </Button>
        )}
      </div>

      <section aria-label="Event results" className="overflow-hidden rounded-lg border border-border bg-surface">
        {page?.error && !loading ? (
          <StatePanel
            tone="error"
            title="Couldn't load events"
            description="Something went wrong while fetching events. Check your connection and try again."
            action={
              <Button variant="secondary" onClick={() => setReloadTick((t) => t + 1)}>
                Retry
              </Button>
            }
          />
        ) : !loading && page && page.rows.length === 0 ? (
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
          <EventTable events={page?.rows ?? []} loading={loading} />
        )}

        {!loading && page && page.rows.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5 text-xs text-fg-secondary">
            <span aria-live="polite">
              Showing {page.rows.length} event{page.rows.length === 1 ? "" : "s"}
              {page.nextCursor ? "" : " · end of results"}
            </span>
            <div className="flex items-center gap-3">
              {moreError && (
                <span role="alert" className="text-error">
                  Couldn&apos;t load more.
                </span>
              )}
              {page.nextCursor && (
                <Button variant="secondary" onClick={loadMore} loading={loadingMore} loadingText="Loading…">
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
