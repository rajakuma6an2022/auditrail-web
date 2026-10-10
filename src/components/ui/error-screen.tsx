import { AuthHeader } from "@/components/layout/auth-header";

// Full-page screen used for 404 and unexpected crashes.
export function ErrorScreen({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AuthHeader />
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <p className="font-mono text-sm text-fg-muted">{code}</p>
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight">{title}</h1>
          <p className="text-sm text-fg-secondary">{description}</p>
          {children && <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{children}</div>}
        </div>
      </main>
    </div>
  );
}

export const linkButtonClass =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-3.5 text-sm font-medium text-fg transition-colors hover:bg-surface-muted";
export const linkButtonPrimaryClass =
  "inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-accent px-3.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover";
