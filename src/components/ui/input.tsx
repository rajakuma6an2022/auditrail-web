import { useId } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string | null;
  hint?: string;
  ref?: React.Ref<HTMLInputElement>;
};

export function Input({ label, error, hint, className, ref, ...rest }: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-9 w-full rounded-md border bg-surface px-3 text-sm text-fg placeholder:text-fg-muted",
          "transition-colors disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
          error ? "border-error" : "border-border hover:border-fg-muted focus:border-ring",
          className,
        )}
        {...rest}
      />
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-xs text-error">
          <svg className="size-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm-.75 3.5h1.5v4h-1.5V5Zm0 5.25h1.5v1.5h-1.5v-1.5Z" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
