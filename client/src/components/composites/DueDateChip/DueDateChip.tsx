import { cn } from "../../utils/cn";
import { formatShortDate, isOverdue } from "../../../lib/format";
import styles from "./DueDateChip.module.css";

export interface DueDateChipProps {
  date?: string;
  /** Card lives in a "done" column — never shows overdue styling. */
  done?: boolean;
  /** Text to show when there is no date. Omit to render nothing. */
  emptyLabel?: string;
  size?: "sm" | "md";
  /** Injectable clock for tests. */
  now?: Date;
  className?: string;
}

const CalendarIcon = () => (
  <svg className={styles.icon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect
      x="2"
      y="3"
      width="12"
      height="11"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M2 6.5h12M5.5 2v2M10.5 2v2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export function DueDateChip({
  date,
  done = false,
  emptyLabel,
  size = "sm",
  now,
  className,
}: DueDateChipProps) {
  if (!date) {
    if (!emptyLabel) return null;
    return (
      <span
        className={cn(styles.root, className)}
        data-size={size}
        data-empty="true"
      >
        <CalendarIcon />
        {emptyLabel}
      </span>
    );
  }

  const overdue = isOverdue(date, { done, ...(now ? { now } : {}) });

  return (
    <span
      className={cn(styles.root, className)}
      data-size={size}
      data-overdue={overdue ? "true" : "false"}
      title={overdue ? "Overdue" : undefined}
    >
      <CalendarIcon />
      {formatShortDate(date, now)}
    </span>
  );
}
