import { api, ApiError } from "./api";
import type { Level } from "@/components/ui/severity-badge";

export type AuditEvent = {
  id: string;
  tenantId: string;
  createdAt: string;
  level: Level;
  service: string;
  actorId: string;
  action: string;
  message: string;
  metadata: unknown;
};

export type Facets = { levels: Level[]; services: string[]; actions: string[] };

export type Filters = { q: string; level: string; service: string; action: string; range: string };

export const EMPTY_FILTERS: Filters = { q: "", level: "", service: "", action: "", range: "" };

export const RANGES: Record<string, { label: string; ms: number }> = {
  "1h": { label: "Last hour", ms: 60 * 60 * 1000 },
  "24h": { label: "Last 24 hours", ms: 24 * 60 * 60 * 1000 },
  "7d": { label: "Last 7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  "30d": { label: "Last 30 days", ms: 30 * 24 * 60 * 60 * 1000 },
};

export function hasActiveFilters(f: Filters) {
  return Object.values(f).some(Boolean);
}

// Pure function: turns UI filters into the API query string.
export function buildListQuery(f: Filters, cursor?: string, now: number = Date.now()): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.level) p.set("level", f.level);
  if (f.service) p.set("service", f.service);
  if (f.action) p.set("action", f.action);
  const range = RANGES[f.range];
  if (range) p.set("from", new Date(now - range.ms).toISOString());
  if (cursor) p.set("cursor", cursor);
  p.set("limit", "25");
  return p.toString();
}

export function listEvents(f: Filters, cursor?: string, signal?: AbortSignal) {
  return api<{ data: AuditEvent[]; nextCursor: string | null }>(`/api/v1/events?${buildListQuery(f, cursor)}`, {
    signal,
  });
}

export function getFacets(signal?: AbortSignal) {
  return api<Facets>("/api/v1/events/facets", { signal });
}

export async function getEvent(id: string, signal?: AbortSignal) {
  const { event } = await api<{ event: AuditEvent }>(`/api/v1/events/${encodeURIComponent(id)}`, { signal });
  return event;
}

export const isAborted = (e: unknown) => e instanceof DOMException && e.name === "AbortError";
export const statusOf = (e: unknown) => (e instanceof ApiError ? e.status : undefined);
