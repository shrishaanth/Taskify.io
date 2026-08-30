/** Small pure formatting helpers used across composites. */

/** "Oct 20" / "Oct 20, 2026" when the year differs from `ref`. */
export function formatShortDate(iso: string, ref: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === ref.getFullYear()
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" };
  return new Intl.DateTimeFormat("en-US", opts).format(d);
}

/**
 * A due date is overdue when it is strictly before the start of today.
 * `done` cards are never overdue regardless of date.
 */
export function isOverdue(
  iso: string | undefined,
  opts: { done?: boolean; now?: Date } = {},
): boolean {
  if (!iso || opts.done) return false;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return false;
  const now = opts.now ?? new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  return due.getTime() < startOfToday;
}

/** "just now" / "2 hours ago" / "3 days ago" / falls back to a short date. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const diffMs = now.getTime() - then.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 45) return "just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return formatShortDate(iso, now);
}

/** "820 B" / "1.2 KB" / "3.4 MB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}
