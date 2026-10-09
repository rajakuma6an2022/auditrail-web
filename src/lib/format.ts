// "Oct 6, 2026 10:04:21 AM" in the viewer's local timezone.
export function formatTime(iso: string): string {
  return new Date(iso)
    .toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/(\d{4}),/, "$1");
}