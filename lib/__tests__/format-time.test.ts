import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "@/lib/format-time";

describe("formatRelativeTime", () => {
  const now = new Date("2026-02-21T20:00:00Z");

  it("returns 'just now' for < 1 minute", () => {
    const date = new Date("2026-02-21T19:59:30Z");
    expect(formatRelativeTime(date, now)).toBe("just now");
  });

  it("returns minutes for < 1 hour", () => {
    const date = new Date("2026-02-21T19:48:00Z");
    expect(formatRelativeTime(date, now)).toBe("12m ago");
  });

  it("returns hours for < 24 hours", () => {
    const date = new Date("2026-02-21T17:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("3h ago");
  });

  it("returns days for < 7 days", () => {
    const date = new Date("2026-02-19T20:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("2d ago");
  });

  it("returns weeks for < 30 days", () => {
    const date = new Date("2026-02-07T20:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("2w ago");
  });

  it("returns short date for >= 30 days", () => {
    const date = new Date("2026-01-15T20:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("Jan 15");
  });
});
