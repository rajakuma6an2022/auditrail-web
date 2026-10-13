"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { demoLogin, getAuthConfig } from "@/lib/auth-api";

// Shown only when the API has the demo enabled. Lets a reviewer explore without an email inbox.
export function DemoLogin() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getAuthConfig()
      .then((c) => alive && setEnabled(c.demoEnabled))
      .catch(() => {
        /* no config = no demo button; normal sign-in still works */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!enabled) return null;

  async function start() {
    setBusy(true);
    setError(null);
    try {
      await demoLogin();
      router.replace("/events");
    } catch {
      setError("Couldn't start the demo. Please try again in a moment.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
      <p className="text-sm text-fg-secondary">
        Just reviewing? Explore with a read-only demo account. It contains synthetic data only.
      </p>
      <Button variant="secondary" onClick={start} loading={busy} loadingText="Opening demo…" className="w-full">
        Try the demo
      </Button>
      {error && (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
