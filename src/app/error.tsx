"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorScreen, linkButtonClass } from "@/components/ui/error-screen";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      code="500"
      title="Something went wrong"
      description="An unexpected error occurred. You can try again, or go back to Events."
    >
      <Button onClick={reset}>Try again</Button>
      <Link href="/events" className={linkButtonClass}>
        Go to Events
      </Link>
      {error.digest && <p className="w-full font-mono text-xs text-fg-muted">Reference: {error.digest}</p>}
    </ErrorScreen>
  );
}
