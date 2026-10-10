"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Spinner } from "@/components/ui/spinner";
import { fetchMe, type User } from "@/lib/auth-api";

type State = { status: "loading" } | { status: "ready"; user: User } | { status: "error" };

// Wraps every signed-in page: verifies the session (/auth/me), shows the header, redirects to /login on 401.
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then(({ user }) => !cancelled && setState({ status: "ready", user }))
      .catch((e: unknown) => {
        if (cancelled) return;
        if ((e as { status?: number }).status === 401) router.replace("/login");
        else setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <Spinner className="size-5 text-accent" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4" role="alert">
        <p className="text-sm text-fg-secondary">Couldn&apos;t load your session. Refresh the page to try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <AppHeader user={state.user} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
