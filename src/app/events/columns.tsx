import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { SeverityBadge } from "@/components/ui/severity-badge";
import type { AuditEvent } from "@/lib/events-api";
import { formatTime } from "@/lib/format";

// Per-column cell styling, shared by header and body so they always line up.
export const CELL_CLASS: Record<string, string> = {
  id: "px-3",
  createdAt: "whitespace-nowrap px-3 text-fg-secondary",
  level: "px-3",
  action: "px-3 font-mono text-xs",
  service: "px-3 text-fg-secondary",
  actorId: "px-3 font-mono text-xs text-fg-secondary",
  message: "max-w-xs truncate px-3 text-fg-secondary",
};

export const columns: ColumnDef<AuditEvent>[] = [
  {
    id: "id",
    header: "Event ID",
    cell: ({ row }) => (
      <Link
        href={`/events/${encodeURIComponent(row.original.id)}`}
        onClick={(e) => e.stopPropagation()}
        className="rounded-sm font-mono text-xs text-accent hover:underline"
      >
        {row.original.id}
      </Link>
    ),
  },
  {
    id: "createdAt",
    header: "Time",
    cell: ({ row }) => <time dateTime={row.original.createdAt}>{formatTime(row.original.createdAt)}</time>,
  },
  { id: "level", header: "Level", cell: ({ row }) => <SeverityBadge level={row.original.level} /> },
  { id: "action", header: "Action", cell: ({ row }) => row.original.action },
  { id: "service", header: "Service", cell: ({ row }) => row.original.service },
  { id: "actorId", header: "Actor", cell: ({ row }) => row.original.actorId },
  {
    id: "message",
    header: "Message",
    cell: ({ row }) => <span title={row.original.message}>{row.original.message}</span>,
  },
];
