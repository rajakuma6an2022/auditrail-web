import { describe, it, expect } from "vitest";
import { EMPTY_FILTERS, buildListQuery, hasActiveFilters, rangeError } from "@/lib/events-api";

describe("buildListQuery", () => {
  it("only sends limit when no filters are set", () => {
    expect(buildListQuery(EMPTY_FILTERS)).toBe("limit=25");
  });

  it("maps filters, trims search and adds the cursor", () => {
    const qs = new URLSearchParams(
      buildListQuery(
        { ...EMPTY_FILTERS, q: "  user_4821 ", level: "ERROR", service: "payments", action: "payment_failed" },
        "abc",
      ),
    );
    expect(qs.get("q")).toBe("user_4821");
    expect(qs.get("level")).toBe("ERROR");
    expect(qs.get("service")).toBe("payments");
    expect(qs.get("action")).toBe("payment_failed");
    expect(qs.get("cursor")).toBe("abc");
    expect(qs.has("from")).toBe(false);
  });

  it("converts a range preset into an absolute from date", () => {
    const now = Date.UTC(2026, 9, 9, 12, 0, 0);
    const qs = new URLSearchParams(buildListQuery({ ...EMPTY_FILTERS, range: "24h" }, undefined, now));
    expect(qs.get("from")).toBe("2026-10-08T12:00:00.000Z");
  });

  it("ignores unknown range values", () => {
    expect(new URLSearchParams(buildListQuery({ ...EMPTY_FILTERS, range: "bogus" })).has("from")).toBe(false);
  });
});

describe("hasActiveFilters", () => {
  it("is false for empty filters and true otherwise", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, level: "WARN" })).toBe(true);
  });
});

describe("custom range", () => {
  it("converts local datetimes to ISO from/to", () => {
    const f = { ...EMPTY_FILTERS, range: "custom", from: "2026-10-01T09:30", to: "2026-10-02T18:00" };
    const qs = new URLSearchParams(buildListQuery(f));
    expect(qs.get("from")).toBe(new Date("2026-10-01T09:30").toISOString());
    expect(qs.get("to")).toBe(new Date("2026-10-02T18:00").toISOString());
  });

  it("ignores from/to unless range is custom, and ignores invalid dates", () => {
    expect(new URLSearchParams(buildListQuery({ ...EMPTY_FILTERS, from: "2026-10-01T09:30" })).has("from")).toBe(false);
    const bad = new URLSearchParams(buildListQuery({ ...EMPTY_FILTERS, range: "custom", from: "garbage", to: "" }));
    expect(bad.has("from")).toBe(false);
    expect(bad.has("to")).toBe(false);
  });

  it("rangeError flags a start after the end only", () => {
    const f = { ...EMPTY_FILTERS, range: "custom" };
    expect(rangeError({ ...f, from: "2026-10-02T00:00", to: "2026-10-01T00:00" })).toMatch(/before the end/);
    expect(rangeError({ ...f, from: "2026-10-01T00:00", to: "2026-10-02T00:00" })).toBeNull();
    expect(rangeError({ ...f, from: "2026-10-01T00:00", to: "" })).toBeNull();
    expect(rangeError({ ...EMPTY_FILTERS, from: "2026-10-02T00:00", to: "2026-10-01T00:00" })).toBeNull();
  });
});
