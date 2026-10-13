"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/components/ui/toast";
import { UserMenu } from "@/components/ui/user-menu";
import { logout, type User } from "@/lib/auth-api";
import { clearScroll } from "@/lib/scroll-memory";

export function AppHeader({ user, onShortcuts }: { user: User; onShortcuts: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setBusy(true);
    try {
      await logout();
    } catch {
      toast("Couldn't reach the server, but you were signed out on this device.", "error");
    } finally {
      queryClient.clear(); // never leave the previous user's cached events in memory
      clearScroll();
      router.replace("/login");
    }
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu user={user} onShortcuts={onShortcuts} onSignOut={onSignOut} signingOut={busy} />
        </div>
      </div>
    </header>
  );
}
