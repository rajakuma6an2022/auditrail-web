import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "@/components/ui/dialog";
import { ShortcutsDialog } from "@/components/ui/shortcuts-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { UserMenu } from "@/components/ui/user-menu";
import { CopyButton } from "@/components/ui/copy-button";
import { clearScroll, readScroll, saveScroll } from "@/lib/scroll-memory";
import { isTyping } from "@/lib/dom";

const user = { id: "u1", email: "dev@payflow.test", name: "Dev User", tenantId: "tenant_payflow" };

async function violations(container: HTMLElement) {
  const r = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return r.violations.map((v) => `${v.id}: ${v.help}`);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Toast", () => {
  function Demo() {
    const toast = useToast();
    return <button onClick={() => toast("Saved it")}>go</button>;
  }

  it("shows a message in a polite live region and auto-dismisses", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    await userEventWithTimers().click(screen.getByText("go"));
    expect(screen.getByText("Saved it")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Notifications" })).toHaveAttribute("aria-live", "polite");
    act(() => {
      vi.advanceTimersByTime(4100);
    });
    expect(screen.queryByText("Saved it")).not.toBeInTheDocument();
  });

  it("can be dismissed manually", async () => {
    const u = userEvent.setup();
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    await u.click(screen.getByText("go"));
    await u.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("Saved it")).not.toBeInTheDocument();
  });

  it("CopyButton copies and confirms with a toast", async () => {
    const u = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(
      <ToastProvider>
        <CopyButton value="evt_1" label="Copy Event ID" successMessage="Event ID copied" />
      </ToastProvider>,
    );
    await u.click(screen.getByRole("button", { name: "Copy Event ID" }));
    expect(writeText).toHaveBeenCalledWith("evt_1");
    expect(await screen.findByText("Event ID copied")).toBeInTheDocument();
  });

  it("CopyButton shows an error toast when the clipboard is unavailable", async () => {
    const u = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    render(
      <ToastProvider>
        <CopyButton value="evt_1" label="Copy Event ID" successMessage="Event ID copied" />
      </ToastProvider>,
    );
    await u.click(screen.getByRole("button", { name: "Copy Event ID" }));
    expect(await screen.findByText("Couldn't copy to the clipboard.")).toBeInTheDocument();
  });
});

function userEventWithTimers() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

describe("Dialog", () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>open</button>
        <Dialog open={open} onClose={() => setOpen(false)} title="Hello dialog">
          <p>Body text</p>
        </Dialog>
      </>
    );
  }

  it("opens with a labelled title and closes via the Close button", async () => {
    const u = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await u.click(screen.getByText("open"));
    const dialog = screen.getByRole("dialog", { name: "Hello dialog" });
    expect(dialog).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the backdrop (the dialog element itself) is clicked", async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(screen.getByText("open"));
    await u.click(screen.getByRole("dialog", { name: "Hello dialog" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no axe violations when open", async () => {
    const u = userEvent.setup();
    const { container } = render(<Harness />);
    await u.click(screen.getByText("open"));
    expect(await violations(container)).toEqual([]);
  });

  it("ShortcutsDialog lists the shortcuts", () => {
    render(<ShortcutsDialog open onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeInTheDocument();
    expect(screen.getByText("Focus the event search")).toBeInTheDocument();
  });
});

describe("UserMenu", () => {
  it("toggles, exposes aria-expanded and shows account details", async () => {
    const u = userEvent.setup();
    render(<UserMenu user={user} onShortcuts={() => {}} onSignOut={() => {}} signingOut={false} />);
    const trigger = screen.getByRole("button", { name: "Account menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await u.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Dev User")).toBeInTheDocument();
    expect(screen.getByText("Tenant: tenant_payflow")).toBeInTheDocument();
  });

  it("Escape closes the menu and returns focus to the trigger", async () => {
    const u = userEvent.setup();
    render(<UserMenu user={user} onShortcuts={() => {}} onSignOut={() => {}} signingOut={false} />);
    const trigger = screen.getByRole("button", { name: "Account menu" });
    await u.click(trigger);
    await u.tab(); // keyboard focus moves from the trigger into the panel
    expect(screen.getByRole("button", { name: "Keyboard shortcuts" })).toHaveFocus();
    await u.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("clicking outside closes the menu", async () => {
    const u = userEvent.setup();
    render(
      <div>
        <p>outside</p>
        <UserMenu user={user} onShortcuts={() => {}} onSignOut={() => {}} signingOut={false} />
      </div>,
    );
    await u.click(screen.getByRole("button", { name: "Account menu" }));
    await u.click(screen.getByText("outside"));
    expect(screen.getByRole("button", { name: "Account menu" })).toHaveAttribute("aria-expanded", "false");
  });

  it("fires the sign out and shortcuts callbacks", async () => {
    const onSignOut = vi.fn();
    const onShortcuts = vi.fn();
    const u = userEvent.setup();
    render(<UserMenu user={user} onShortcuts={onShortcuts} onSignOut={onSignOut} signingOut={false} />);
    await u.click(screen.getByRole("button", { name: "Account menu" }));
    await u.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
    await u.click(screen.getByRole("button", { name: "Keyboard shortcuts" }));
    expect(onShortcuts).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations while open", async () => {
    const u = userEvent.setup();
    const { container } = render(
      <UserMenu user={user} onShortcuts={() => {}} onSignOut={() => {}} signingOut={false} />,
    );
    await u.click(screen.getByRole("button", { name: "Account menu" }));
    expect(await violations(container)).toEqual([]);
  });
});

describe("helpers", () => {
  it("scroll memory stores per key and clears", () => {
    clearScroll();
    expect(readScroll("a")).toBe(0);
    saveScroll("a", 420);
    saveScroll("b", 10);
    expect(readScroll("a")).toBe(420);
    clearScroll();
    expect(readScroll("a")).toBe(0);
  });

  it("isTyping detects form fields only", () => {
    expect(isTyping(document.createElement("input"))).toBe(true);
    expect(isTyping(document.createElement("select"))).toBe(true);
    expect(isTyping(document.createElement("div"))).toBe(false);
    expect(isTyping(null)).toBe(false);
  });
});
