import { describe, it, expect } from "vitest";
import {
  formatShortDate,
  formatDueDate,
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

describe("due dates are calendar days, not instants", () => {
  // What the date picker stores for "20 Oct 2026".
  const due = "2026-10-20T00:00:00.000Z";

  it("shows the picked day in every timezone", () => {
    expect(formatDueDate(due, REF)).toBe("Oct 20");
    expect(formatDueDate("2027-01-05T00:00:00.000Z", REF)).toBe("Jan 5, 2027");
  });

  it("is not overdue at any time on the due day itself", () => {
    expect(isOverdue(due, { now: new Date(2026, 9, 20, 0, 0, 1) })).toBe(false);
    expect(isOverdue(due, { now: new Date(2026, 9, 20, 23, 59, 59) })).toBe(false);
  });

  it("is overdue from the following local day", () => {
    expect(isOverdue(due, { now: new Date(2026, 9, 21, 0, 0, 1) })).toBe(true);
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
