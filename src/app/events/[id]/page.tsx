import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { EventDetail } from "./event-detail";

export const metadata: Metadata = { title: "Event Detail" };

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <EventDetail id={id} />
    </AppShell>
  );
}