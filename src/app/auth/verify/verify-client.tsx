"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { verifyMagicLink } from "@/lib/auth-api";

const INVALID = "This sign-in link is invalid or has expired.";

export function VerifyClient() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // the token is single-use, so never call verify twice (React Strict Mode)
    verifyMagicLink(token)
      .then(() => router.replace("/events"))
      .catch((e: unknown) => {
        const status = (e as { status?: number }).status;
        setError(status === 0 ? "Could not reach the server. Please try again." : INVALID);
      });
  }, [token, router]);

  const message = !token ? INVALID : error;

  if (message) {
    return (
      <div className="flex flex-col gap-4" role="alert">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight">Couldn&apos;t sign you in</h1>
          <p className="text-sm text-fg-secondary">{message}</p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-3.5 text-sm font-medium transition-colors hover:bg-surface-muted"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3" role="status">
      <Spinner className="size-5 text-accent" />
      <p className="text-sm text-fg-secondary">Signing you in…</p>
    </div>
  );
}
