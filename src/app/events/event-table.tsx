"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditEvent } from "@/lib/events-api";
import { formatTime } from "@/lib/format";

const COLUMNS = ["Event ID", "Time", "Level", "Action", "Service", "Actor", "Message"];

export function EventTableSkeleton() {
  return (
    <tbody aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <tr key={i} className="border-b border-border last:border-0">
          {COLUMNS.map((c) => (
            <td key={c} className="px-3 py-3">
              <Skeleton className="h-4 w-full max-w-32" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function EventTable({ events, loading }: { events: AuditEvent[]; loading: boolean }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-225 border-collapse text-left text-sm" aria-busy={loading}>
        <caption className="sr-only">Audit events, newest first</caption>
        <thead>
          <tr className="border-b border-border bg-surface-muted text-xs font-medium text-fg-secondary">
            {COLUMNS.map((c) => (
              <th key={c} scope="col" className="px-3 py-2.5 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        {loading ? (
          <EventTableSkeleton />
        ) : (
          <tbody>
            {events.map((e) => (
              <tr
                key={e.id}
                onClick={() => router.push(`/events/${encodeURIComponent(e.id)}`)}
                className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-muted"
              >
                <td className="px-3 py-2.5">
                  <Link
                    href={`/events/${encodeURIComponent(e.id)}`}
                    onClick={(ev) => ev.stopPropagation()}
                    className="rounded-sm font-mono text-xs text-accent hover:underline"
                  >
                    {e.id}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-fg-secondary">
                  <time dateTime={e.createdAt}>{formatTime(e.createdAt)}</time>
                </td>
                <td className="px-3 py-2.5">
                  <SeverityBadge level={e.level} />
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">{e.action}</td>
                <td className="px-3 py-2.5 text-fg-secondary">{e.service}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-fg-secondary">{e.actorId}</td>
                <td className="max-w-xs truncate px-3 py-2.5 text-fg-secondary" title={e.message}>
                  {e.message}
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}