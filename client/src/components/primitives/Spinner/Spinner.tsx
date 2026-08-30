import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Spinner.module.css";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  /** Accessible name announced to screen readers. */
  label?: string;
}

export function Spinner({
  size = "md",
  label = "Loading",
  className,
  ...rest
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(styles.root, className)}
      data-size={size}
      {...rest}
    />
  );
}
