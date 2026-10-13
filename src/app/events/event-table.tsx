"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditEvent } from "@/lib/events-api";
import { readScroll, saveScroll } from "@/lib/scroll-memory";
import { CELL_CLASS, columns } from "./columns";

const ROW_HEIGHT = 41; // fixed row height (no wrapping) is what makes virtualization cheap and exact
const PREFETCH_DISTANCE = 8; // start loading the next page when this close to the last loaded row

export function EventTableSkeleton() {
  return (
    <div role="status" aria-label="Loading events" className="overflow-hidden">
      <div className="h-[41px] border-b border-border bg-surface-muted" />
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex h-[41px] items-center gap-6 border-b border-border px-3 last:border-0">
          {columns.map((c) => (
            <Skeleton key={c.id} className="h-4 w-full max-w-32" />
          ))}
        </div>
      ))}
    </div>
  );
}

type Props = {
  events: AuditEvent[];
  scrollKey: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  nextPageFailed: boolean;
  fetchNextPage: () => void;
};

export function EventTable({
  events,
  scrollKey,
  hasNextPage,
  isFetchingNextPage,
  nextPageFailed,
  fetchNextPage,
}: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // TanStack Table/Virtual return unmemoizable functions; harmless here (React Compiler is not enabled).
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: events, columns, getCoreRowModel: getCoreRowModel(), getRowId: (e) => e.id });
  const rows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    // Restores the scroll position (e.g. Back from an event): the virtualizer renders the rows around this offset
    // on its FIRST render and scrolls the container there, so the content is tall enough before scrolling.
    initialOffset: () => readScroll(scrollKey),
  });
  const items = virtualizer.getVirtualItems();
  const paddingTop = items.length > 0 ? items[0]!.start : 0;
  const paddingBottom = items.length > 0 ? virtualizer.getTotalSize() - items[items.length - 1]!.end : 0;
  const lastRendered = items.length > 0 ? items[items.length - 1]!.index : -1;

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !nextPageFailed && lastRendered >= rows.length - PREFETCH_DISTANCE) {
      fetchNextPage();
    }
  }, [lastRendered, rows.length, hasNextPage, isFetchingNextPage, nextPageFailed, fetchNextPage]);

  return (
    <div
      ref={scrollRef}
      role="region"
      aria-label="Events table"
      tabIndex={0}
      onScroll={(e) => saveScroll(scrollKey, e.currentTarget.scrollTop)}
      className="max-h-[70vh] overflow-auto"
    >
      <table
        className="w-full min-w-225 border-separate border-spacing-0 text-left text-sm"
        aria-rowcount={hasNextPage ? -1 : rows.length + 1}
      >
        <caption className="sr-only">Audit events, newest first</caption>
        <thead className="sticky top-0 z-10">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} aria-rowindex={1}>
              {group.headers.map((h) => (
                <th
                  key={h.id}
                  scope="col"
                  className="h-[41px] border-b border-border bg-surface-muted px-3 text-xs font-medium text-fg-secondary"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr aria-hidden="true" style={{ height: paddingTop }}>
              <td colSpan={columns.length} className="p-0" />
            </tr>
          )}
          {items.map((item) => {
            const row = rows[item.index]!;
            return (
              <tr
                key={row.id}
                aria-rowindex={item.index + 2}
                onClick={() => router.push(`/events/${encodeURIComponent(row.original.id)}`)}
                className="h-[41px] cursor-pointer transition-colors hover:bg-surface-muted"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={`border-b border-border ${CELL_CLASS[cell.column.id] ?? "px-3"}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr aria-hidden="true" style={{ height: paddingBottom }}>
              <td colSpan={columns.length} className="p-0" />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
