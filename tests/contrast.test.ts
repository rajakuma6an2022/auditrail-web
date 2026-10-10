import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(__dirname, "../src/app/globals.css"), "utf8");

function tokens(selector: ":root" | ".dark"): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1]!, m[2]!]));
}

const channel = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

// [text token, background token] pairs that actually appear in the UI. WCAG AA body text = 4.5:1.
const PAIRS: Array<[string, string]> = [
  ["fg", "background"],
  ["fg", "surface"],
  ["fg-secondary", "background"],
  ["fg-secondary", "surface"],
  ["fg-secondary", "surface-muted"],
  ["fg-muted", "background"],
  ["fg-muted", "surface"],
  ["fg-muted", "surface-muted"],
  ["accent", "surface"],
  ["accent", "accent-soft"],
  ["accent-fg", "accent"],
  ["accent-fg", "accent-hover"],
  ["success", "success-soft"],
  ["warning", "warning-soft"],
  ["error", "error-soft"],
  ["error", "surface"],
];

describe.each([":root", ".dark"] as const)("WCAG AA text contrast (%s)", (selector) => {
  const t = tokens(selector);
  it.each(PAIRS)("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(t[fg], `missing token ${fg}`).toBeDefined();
    expect(t[bg], `missing token ${bg}`).toBeDefined();
    expect(ratio(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(4.5);
  });
});
