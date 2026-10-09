"use client";

import "./globals.css";

// Last-resort boundary: replaces the root layout, so it must render its own <html>/<body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-background px-4 text-fg">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <p className="font-mono text-sm text-fg-muted">500</p>
          <h1 className="text-[22px] font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-fg-secondary">The application hit an unexpected error. Try reloading.</p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-sm font-medium text-accent-fg hover:bg-accent-hover"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}