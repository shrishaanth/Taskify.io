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
 * A due date is a calendar day, stored as that day's UTC midnight. Formatting
 * or comparing it as an instant shifts it by the viewer's offset: west of UTC
 * it would read a day early and count as overdue on the due day itself.
 */
const dueDay = (iso: string) => iso.slice(0, 10);

const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

export function formatDueDate(iso: string, ref: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const opts: Intl.DateTimeFormatOptions =
    d.getUTCFullYear() === ref.getFullYear()
      ? { month: "short", day: "numeric", timeZone: "UTC" }
      : { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat("en-US", opts).format(d);
}

export function isOverdue(
  iso: string | undefined,
  opts: { done?: boolean; now?: Date } = {},
): boolean {
  if (!iso || opts.done) return false;
  if (Number.isNaN(new Date(iso).getTime())) return false;
  return dueDay(iso) < localDay(opts.now ?? new Date());
}

/** Due today or within the next two days, and not yet overdue. */
export function isDueSoon(
  iso: string | undefined,
  opts: { done?: boolean; now?: Date } = {},
): boolean {
  if (!iso || opts.done || isOverdue(iso, opts)) return false;
  if (Number.isNaN(new Date(iso).getTime())) return false;
  const now = opts.now ?? new Date();
  const horizon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  return dueDay(iso) <= localDay(horizon);
}

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

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}
