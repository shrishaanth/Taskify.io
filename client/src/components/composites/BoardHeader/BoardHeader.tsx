import { cn } from "../../utils/cn";
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "../../primitives/Breadcrumbs/Breadcrumbs";
import styles from "./BoardHeader.module.css";

export interface BoardHeaderProps {
  name: string;
  breadcrumbs: BreadcrumbItem[];
  className?: string;
}

export function BoardHeader({ name, breadcrumbs, className }: BoardHeaderProps) {
  return (
    <header className={cn(styles.root, className)}>
      <Breadcrumbs items={breadcrumbs} />
      <div className={styles.titleRow}>
        <h1 className={styles.name}>{name}</h1>
      </div>
    </header>
  );
}
