import { describe, it, expect } from "vitest";
import {
  formatShortDate,
  isOverdue,
  formatRelativeTime,
  formatFileSize,
} from "./format";

const REF = new Date("2026-08-30T12:00:00Z");

describe("formatShortDate", () => {
  it("omits the year when it matches the reference date", () => {
    expect(formatShortDate("2026-10-20T00:00:00Z", REF)).toBe("Oct 20");
  });
  it("includes the year when it differs", () => {
    expect(formatShortDate("2027-01-05T00:00:00Z", REF)).toBe("Jan 5, 2027");
  });
  it("returns empty string for junk", () => {
    expect(formatShortDate("nope", REF)).toBe("");
  });
});

describe("isOverdue", () => {
  // Build dates in local time so the day-boundary check is timezone-robust.
  const now = new Date(2026, 7, 30, 12, 0, 0);
  const iso = (y: number, m: number, d: number, h = 12) =>
    new Date(y, m, d, h).toISOString();

  it("is true for a date before the start of today", () => {
    expect(isOverdue(iso(2026, 7, 29), { now })).toBe(true);
  });
  it("is false for today or later", () => {
    expect(isOverdue(iso(2026, 7, 30, 9), { now })).toBe(false);
    expect(isOverdue(iso(2026, 8, 15), { now })).toBe(false);
  });
  it("is false when the card is done, no matter the date", () => {
    expect(isOverdue(iso(2020, 0, 1), { now, done: true })).toBe(false);
  });
  it("is false when there is no due date", () => {
    expect(isOverdue(undefined, { now })).toBe(false);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-30T12:00:00Z");
  it("handles seconds, minutes, hours and days", () => {
    expect(formatRelativeTime("2026-08-30T11:59:40Z", now)).toBe("just now");
    expect(formatRelativeTime("2026-08-30T11:30:00Z", now)).toBe("30 minutes ago");
    expect(formatRelativeTime("2026-08-30T10:00:00Z", now)).toBe("2 hours ago");
    expect(formatRelativeTime("2026-08-28T12:00:00Z", now)).toBe("2 days ago");
  });
  it("singularises 1", () => {
    expect(formatRelativeTime("2026-08-30T11:00:00Z", now)).toBe("1 hour ago");
  });
  it("falls back to a short date past a week", () => {
    expect(formatRelativeTime("2026-08-01T12:00:00Z", now)).toBe("Aug 1");
  });
});

describe("formatFileSize", () => {
  it("formats B / KB / MB", () => {
    expect(formatFileSize(820)).toBe("820 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
  it("guards bad input", () => {
    expect(formatFileSize(-1)).toBe("");
  });
});
