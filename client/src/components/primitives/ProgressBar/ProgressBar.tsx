import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import type { BadgeTone } from "../Badge/Badge";
import styles from "./ProgressBar.module.css";

export interface ProgressBarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  /** Percentage 0–100. Ignored when `total` is provided. */
  value?: number;
  current?: number;
  total?: number;
  tone?: BadgeTone;
  /** Accessible label for the progressbar. */
  label?: string;
}

function clampPercent(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function ProgressBar({
  value,
  current,
  total,
  tone = "sky",
  label,
  className,
  ...rest
}: ProgressBarProps) {
  const percent =
    typeof total === "number" && total > 0
      ? clampPercent(((current ?? 0) / total) * 100)
      : clampPercent(value ?? 0);
  const rounded = Math.round(percent);

  return (
    <div
      className={cn(styles.root, className)}
      data-tone={tone}
      role="progressbar"
      aria-valuenow={rounded}
      aria-valuemin={0}
      aria-valuemax={100}
      {...(label ? { "aria-label": label } : null)}
      {...rest}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} data-testid="progress-fill" />
    </div>
  );
}
