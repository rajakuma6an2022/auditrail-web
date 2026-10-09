import type { Metadata } from "next";
import { EventsShell } from "./events-shell";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return <EventsShell />;
}