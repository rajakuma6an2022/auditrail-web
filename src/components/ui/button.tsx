import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover border border-transparent",
  secondary: "bg-surface text-fg border border-border hover:bg-surface-muted",
  ghost: "bg-transparent text-fg-secondary border border-transparent hover:bg-surface-muted hover:text-fg",
  destructive: "bg-error text-accent-fg border border-transparent hover:opacity-90",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  loadingText?: string;
};

export function Button({
  variant = "primary",
  loading = false,
  loadingText,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}