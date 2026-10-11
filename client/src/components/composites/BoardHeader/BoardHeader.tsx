import { cn } from "../../utils/cn";
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "../../primitives/Breadcrumbs/Breadcrumbs";
import { IconButton } from "../../primitives/IconButton/IconButton";
import { Menu, type MenuItem } from "../../primitives/Menu/Menu";
import styles from "./BoardHeader.module.css";

export interface BoardHeaderProps {
  name: string;
  breadcrumbs: BreadcrumbItem[];
  /** Rename, delete and the like; the menu is hidden when empty. */
  actions?: MenuItem[];
  className?: string;
}

export function BoardHeader({
  name,
  breadcrumbs,
  actions = [],
  className,
}: BoardHeaderProps) {
  return (
    <header className={cn(styles.root, className)}>
      <Breadcrumbs items={breadcrumbs} />
      <div className={styles.titleRow}>
        <h1 className={styles.name}>{name}</h1>
        {actions.length > 0 && (
          <Menu
            menuLabel="Board actions"
            placement="bottom-start"
            trigger={
              <IconButton
                label="Board actions"
                size="sm"
                icon={<span aria-hidden="true">⋯</span>}
              />
            }
            items={actions}
          />
        )}
      </div>
    </header>
  );
}
