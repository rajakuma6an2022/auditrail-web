// Shared layout for empty / error / not-found / unauthorized states.
export function StatePanel({
  title,
  description,
  action,
  tone = "neutral",
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="flex flex-col items-center gap-3 px-4 py-14 text-center"
    >
      <h2 className={`text-base font-semibold ${tone === "error" ? "text-error" : "text-fg"}`}>{title}</h2>
      <p className="max-w-md text-sm text-fg-secondary">{description}</p>
      {action}
    </div>
  );
}
