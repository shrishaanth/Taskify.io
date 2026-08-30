import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  icon: ReactNode;
  tone?: "sky" | "red" | "slate";
  title: string;
  description?: string;
  /** 0–2 action buttons. */
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  tone = "sky",
  title,
  description,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(styles.root, className)} data-tone={tone} role="status">
      <span className={styles.iconWrap} aria-hidden="true">
        {icon}
      </span>
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
