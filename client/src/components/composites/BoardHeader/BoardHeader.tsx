import { cn } from "../../utils/cn";
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "../../primitives/Breadcrumbs/Breadcrumbs";
import { AvatarGroup } from "../../primitives/AvatarGroup/AvatarGroup";
import { IconButton } from "../../primitives/IconButton/IconButton";
import { Menu, type MenuItem } from "../../primitives/Menu/Menu";
import type { UserRef } from "../../../types/domain";
import styles from "./BoardHeader.module.css";

export interface BoardHeaderProps {
  name: string;
  breadcrumbs: BreadcrumbItem[];
  /** Rename, delete and the like; the menu is hidden when empty. */
  actions?: MenuItem[];
  /** People who can work on this board, shown at the end of the title row. */
  members?: UserRef[];
  className?: string;
}

export function BoardHeader({
  name,
  breadcrumbs,
  actions = [],
  members = [],
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
        {members.length > 0 && (
          <span className={styles.presence}>
            <AvatarGroup
              aria-label={`${members.length} project member${members.length === 1 ? "" : "s"}`}
              avatars={members.map((m) => ({
                name: m.name,
                ...(m.avatarUrl ? { src: m.avatarUrl } : {}),
              }))}
              max={5}
              size="sm"
            />
          </span>
        )}
      </div>
    </header>
  );
}
