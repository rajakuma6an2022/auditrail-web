"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getEvent, isAborted, statusOf, type AuditEvent } from "@/lib/events-api";
import { formatTime } from "@/lib/format";
import { BackLink } from "./back-link";

type State =
  | { status: "loading" }
  | { status: "found"; event: AuditEvent }
  | { status: "not-found" }
  | { status: "unauthorized" }
  | { status: "error" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-fg-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-fg">{children}</dd>
    </div>
  );
}

export function EventDetail({ id }: { id: string }) {
  const [result, setResult] = useState<{ id: string; tick: number; state: State } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const done = (state: State) => setResult({ id, tick, state });
    getEvent(id, ctrl.signal)
      .then((event) => done({ status: "found", event }))
      .catch((e: unknown) => {
        if (isAborted(e)) return;
        const status = statusOf(e);
        done(
          status === 404
            ? { status: "not-found" }
            : status === 401 || status === 403
              ? { status: "unauthorized" }
              : { status: "error" },
        );
      });
    return () => ctrl.abort();
  }, [id, tick]);

  const state: State = result && result.id === id && result.tick === tick ? result.state : { status: "loading" };
  const event = state.status === "found" ? state.event : null;

  return (
    <div className="mx-auto flex max-w-225 flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackLink />
        <Breadcrumb items={[{ label: "Events", href: "/events" }, { label: "Event Detail" }]} />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight">Event Detail</h1>
          {event && <SeverityBadge level={event.level} />}
        </div>
      </div>

      {state.status === "loading" && (
        <div
          role="status"
          aria-label="Loading event"
          className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {state.status === "not-found" && (
        <div className="rounded-lg border border-border bg-surface">
          <StatePanel
            title="Event not found"
            description="This event doesn't exist, or you don't have access to it. Check the event ID and try again."
            action={
              <Link
                href="/events"
                className="inline-flex h-9 items-center rounded-md border border-border px-3.5 text-sm font-medium hover:bg-surface-muted"
              >
                Back to Events
              </Link>
            }
          />
        </div>
      )}

      {state.status === "unauthorized" && (
        <div className="rounded-lg border border-border bg-surface">
          <StatePanel
            tone="error"
            title="You can't view this event"
            description="Your session has expired or you don't have permission. Sign in again to continue."
            action={
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-sm font-medium text-accent-fg hover:bg-accent-hover"
              >
                Sign in
              </Link>
            }
          />
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-lg border border-border bg-surface">
          <StatePanel
            tone="error"
            title="Couldn't load this event"
            description="Something went wrong while fetching the event. Try again."
            action={
              <Button variant="secondary" onClick={() => setTick((t) => t + 1)}>
                Retry
              </Button>
            }
          />
        </div>
      )}

      {event && (
        <>
          <section aria-labelledby="info-heading" className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="info-heading" className="text-base font-semibold">
                Event information
              </h2>
              <CopyButton value={event.id} label="Copy Event ID" />
            </div>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Event ID">
                <span className="font-mono text-[13px]">{event.id}</span>
              </Field>
              <Field label="Time">
                <time dateTime={event.createdAt}>{formatTime(event.createdAt)}</time>
                <span className="mt-0.5 block font-mono text-xs text-fg-muted">{event.createdAt}</span>
              </Field>
              <Field label="Level">
                <SeverityBadge level={event.level} />
              </Field>
              <Field label="Service">{event.service}</Field>
              <Field label="Actor">
                <span className="font-mono text-[13px]">{event.actorId}</span>
              </Field>
              <Field label="Action">
                <span className="font-mono text-[13px]">{event.action}</span>
              </Field>
            </dl>
          </section>

          <section aria-labelledby="message-heading" className="rounded-lg border border-border bg-surface p-5">
            <h2 id="message-heading" className="mb-2 text-base font-semibold">
              Message
            </h2>
            <p className="text-sm text-fg">{event.message}</p>
          </section>

          <section aria-labelledby="metadata-heading" className="rounded-lg border border-border bg-surface p-5">
            <h2 id="metadata-heading" className="mb-3 text-base font-semibold">
              Metadata
            </h2>
            <pre
              tabIndex={0}
              aria-label="Event metadata (JSON)"
              className="max-h-96 overflow-auto rounded-md bg-surface-muted p-3 font-mono text-xs leading-relaxed text-fg"
            >
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </section>
        </>
      )}
    </div>
  );
}
