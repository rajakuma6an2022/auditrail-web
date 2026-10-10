import { useId } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label: string;
  placeholder: string; // text of the empty "all" option
  options: Array<{ value: string; label: string }>;
};

// Native <select>: fully keyboard/screen-reader accessible with no extra code.
export function Select({ label, placeholder, options, className, ...rest }: Props) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        className={cn(
          "h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-fg transition-colors",
          "hover:border-fg-muted focus:border-ring disabled:cursor-not-allowed disabled:opacity-50",
          rest.value ? "border-accent/60" : "",
          className,
        )}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
