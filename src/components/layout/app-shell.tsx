"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { ShortcutsDialog } from "@/components/ui/shortcuts-dialog";
import { Spinner } from "@/components/ui/spinner";
import { isTyping } from "@/lib/dom";
import { useMe } from "@/lib/queries";

// Wraps every signed-in page: verifies the session (/auth/me). A 401 is handled globally (see Providers).
export function AppShell({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "?" && !isTyping(e.target) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (me.isPending || (me.isError && (me.error as { status?: number }).status === 401)) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <Spinner className="size-5 text-accent" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (me.isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4" role="alert">
        <p className="text-sm text-fg-secondary">Couldn&apos;t load your session. Refresh the page to try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <AppHeader user={me.data.user} onShortcuts={() => setShortcutsOpen(true)} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
