"use client";

import { Button } from "./button";
import { useToast } from "./toast";

export function CopyButton({ value, label, successMessage }: { value: string; label: string; successMessage: string }) {
  const toast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast(successMessage);
    } catch {
      toast("Couldn't copy to the clipboard.", "error");
    }
  }

  return (
    <Button variant="secondary" onClick={copy}>
      {label}
    </Button>
  );
}
