import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Skeleton.module.css";

export type SkeletonVariant = "line" | "block" | "circle";

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  /** Number of placeholder bars to render. */
  count?: number;
  radius?: string;
}

const toCssSize = (v: string | number | undefined): string | undefined =>
  typeof v === "number" ? `${v}px` : v;

export function Skeleton({
  variant = "line",
  width,
  height,
  count = 1,
  radius,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const barStyle: CSSProperties = {
    ...style,
    ...(toCssSize(width) ? { width: toCssSize(width) } : null),
    ...(toCssSize(height) ? { height: toCssSize(height) } : null),
    ...(radius ? { borderRadius: radius } : null),
  };

  if (count <= 1) {
    return (
      <span
        aria-hidden="true"
        className={cn(styles.root, className)}
        data-variant={variant}
        style={barStyle}
        {...rest}
      />
    );
  }

  return (
    <span className={styles.group} aria-hidden="true" data-testid="skeleton-group">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(styles.root, className)}
          data-variant={variant}
          style={barStyle}
        />
      ))}
    </span>
  );
}
