"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// Goes back in history when possible so the explorer's filters are preserved.
export function BackLink() {
  const router = useRouter();
  return (
    <Link
      href="/events"
      onClick={(e) => {
        if (window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
      className="inline-flex items-center gap-1 rounded-sm text-sm text-fg-secondary hover:text-fg"
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m15 18-6-6 6-6" />
      </svg>
      Back to Events
    </Link>
  );
}