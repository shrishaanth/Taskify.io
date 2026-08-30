import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Badge.module.css";

export type BadgeTone =
  | "sky"
  | "slate"
  | "red"
  | "amber"
  | "green"
  | "violet"
  | "purple"
  | "rose"
  | "pink";

export type BadgeVariant = "soft" | "solid" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  /** Render a small leading status dot (e.g. "● Live"). */
  leadingDot?: boolean;
  children: ReactNode;
}

export function Badge({
  tone = "slate",
  variant = "soft",
  size = "md",
  leadingDot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(styles.root, className)}
      data-tone={tone}
      data-variant={variant}
      data-size={size}
      {...rest}
    >
      {leadingDot && <span className={styles.dot} data-testid="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
