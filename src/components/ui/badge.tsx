import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "info" | "warning" | "error" | "success";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-fg-secondary border-border",
  info: "bg-accent-soft text-accent border-accent/30",
  warning: "bg-warning-soft text-warning border-warning/30",
  error: "bg-error-soft text-error border-error/30",
  success: "bg-success-soft text-success border-success/30",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
