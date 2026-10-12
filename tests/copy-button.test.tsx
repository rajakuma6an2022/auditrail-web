import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CopyButton } from "@/components/ui/copy-button";

describe("CopyButton", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows visible feedback when copying succeeds", async () => {
    writeText.mockResolvedValue(undefined);

    render(<CopyButton value="event-123" label="Copy event ID" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy event ID" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    });

    expect(writeText).toHaveBeenCalledWith("event-123");
    expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard");
  });

  it("shows visible feedback when copying fails", async () => {
    writeText.mockRejectedValue(new Error("Clipboard unavailable"));

    render(<CopyButton value="event-123" label="Copy event ID" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy event ID" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copy failed" })).toBeInTheDocument();
    });

    expect(screen.getByRole("status")).toHaveTextContent("Copy failed");
  });
});
