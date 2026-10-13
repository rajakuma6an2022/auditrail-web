import { Dialog } from "./dialog";

const SHORTCUTS: Array<[string, string]> = [
  ["/", "Focus the event search"],
  ["?", "Show this list"],
  ["Esc", "Close a dialog or menu"],
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts">
      <dl className="flex flex-col gap-2">
        {SHORTCUTS.map(([key, description]) => (
          <div key={key} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-fg-secondary">{description}</dt>
            <dd>
              <kbd className="rounded-sm border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
                {key}
              </kbd>
            </dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}
