import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "../../primitives/Breadcrumbs/Breadcrumbs";
import styles from "./PageHeader.module.css";

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** Right-aligned action, usually a <Button>. */
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn(styles.root, className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
      <div className={styles.row}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
    </header>
  );
}
