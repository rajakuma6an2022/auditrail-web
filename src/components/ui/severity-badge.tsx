import { Badge, type BadgeTone } from "./badge";

export type Level = "INFO" | "WARN" | "ERROR";

const config: Record<Level, { tone: BadgeTone; icon: React.ReactNode }> = {
  INFO: {
    tone: "info",
    icon: <circle cx="8" cy="8" r="5" />, // circle
  },
  WARN: {
    tone: "warning",
    icon: <path d="M8 2.5 14 13H2L8 2.5Z" />, // triangle
  },
  ERROR: {
    tone: "error",
    icon: <path d="M8 1.5 14.5 8 8 14.5 1.5 8 8 1.5Z" />, // diamond
  },
};

// Text label + distinct shape + color: severity is never color-only.
export function SeverityBadge({ level }: { level: Level }) {
  const { tone, icon } = config[level];
  return (
    <Badge tone={tone} className="font-mono tracking-wide">
      <svg className="size-2.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        {icon}
      </svg>
      {level}
    </Badge>
  );
}
