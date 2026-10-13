"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { User } from "@/lib/auth-api";

type Props = { user: User; onShortcuts: () => void; onSignOut: () => void; signingOut: boolean };

const itemClass =
  "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm text-fg hover:bg-surface-muted disabled:opacity-50";

// Disclosure pattern: a button that shows/hides a panel of buttons. Esc closes and returns focus to the trigger.
export function UserMenu({ user, onShortcuts, onSignOut, signingOut }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        if (open && !rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-sm text-fg-secondary transition-colors hover:bg-surface-muted hover:text-fg"
      >
        <span
          aria-hidden="true"
          className="inline-flex size-5 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent"
        >
          {user.email.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-40 truncate font-mono text-xs sm:inline">{user.email}</span>
        <svg
          className="size-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-border bg-surface p-1 shadow-sm"
        >
          <div className="border-b border-border px-2 py-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="truncate font-mono text-xs text-fg-secondary">{user.email}</p>
            <p className="mt-0.5 text-xs text-fg-muted">Tenant: {user.tenantId}</p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                onShortcuts();
              }}
            >
              Keyboard shortcuts
            </button>
            <button type="button" className={itemClass} onClick={onSignOut} disabled={signingOut}>
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
