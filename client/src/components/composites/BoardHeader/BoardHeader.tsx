import { cn } from "../../utils/cn";
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "../../primitives/Breadcrumbs/Breadcrumbs";
import { AvatarGroup } from "../../primitives/AvatarGroup/AvatarGroup";
import { ConnectionStatus } from "../ConnectionStatus/ConnectionStatus";
import type { UserRef } from "../../../types/domain";
import styles from "./BoardHeader.module.css";

export interface BoardHeaderProps {
  name: string;
  breadcrumbs: BreadcrumbItem[];
  connection: "live" | "offline";
  /** Users currently viewing the board (presence). */
  presence: UserRef[];
  className?: string;
}

/**
 * Board header. Has NO invite control — boards inherit access from the parent
 * Project (FR-3.1; the mockup set's correction note removed the stray
 * "+ Invite" button).
 */
export function BoardHeader({
  name,
  breadcrumbs,
  connection,
  presence,
  className,
}: BoardHeaderProps) {
  return (
    <header className={cn(styles.root, className)}>
      <Breadcrumbs items={breadcrumbs} />
      <div className={styles.titleRow}>
        <h1 className={styles.name}>{name}</h1>
        <ConnectionStatus status={connection} />
        {presence.length > 0 && (
          <div className={styles.presence}>
            <AvatarGroup
              avatars={presence.map((u) => ({
                name: u.name,
                ...(u.avatarUrl ? { src: u.avatarUrl } : {}),
              }))}
              max={4}
              size="sm"
            />
          </div>
        )}
      </div>
    </header>
  );
}
