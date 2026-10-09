"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logout, type User } from "@/lib/auth-api";

export function AppHeader({ user }: { user: User }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setBusy(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-xs text-fg-secondary sm:inline">{user.email}</span>
          <ThemeToggle />
          <Button variant="secondary" onClick={onSignOut} loading={busy} loadingText="Signing out…">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}