export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-fg">
      <svg className="size-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 6h16M4 12h10M4 18h6" />
        <circle cx="18" cy="16" r="3" />
      </svg>
      Auditrail
    </span>
  );
}