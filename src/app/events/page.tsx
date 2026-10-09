import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { EventExplorer } from "./event-explorer";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <EventExplorer />
      </Suspense>
    </AppShell>
  );
}