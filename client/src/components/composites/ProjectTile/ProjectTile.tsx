import type { KeyboardEvent } from "react";
import { cn } from "../../utils/cn";
import { AvatarGroup } from "../../primitives/AvatarGroup/AvatarGroup";
import { RoleBadge } from "../RoleBadge/RoleBadge";
import type { ProjectSummary } from "../../../types/domain";
import styles from "./ProjectTile.module.css";

export interface ProjectTileProps {
  project: ProjectSummary;
  onOpen: () => void;
  className?: string;
}

const LockIcon = () => (
  <svg className={styles.lockIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export function ProjectTile({ project, onOpen, className }: ProjectTileProps) {
  const locked = project.role === null;

  if (locked) {
    return (
      <div
        className={cn(styles.root, styles.locked, className)}
        data-variant="no-access"
        aria-disabled="true"
      >
        <div className={styles.topRow}>
          <RoleBadge scope="project" role="no-access" size="sm" uppercase />
          {project.category && <span className={styles.category}>{project.category}</span>}
        </div>
        <h3 className={styles.name}>{project.name}</h3>
        <span className={styles.lockedNote}>
          <LockIcon />
          Private project board
        </span>
      </div>
    );
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      className={cn(styles.root, styles.interactive, className)}
      data-variant="accessible"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKeyDown}
    >
      <div className={styles.topRow}>
        <RoleBadge scope="project" role={project.role ?? "member"} size="sm" uppercase />
        {project.category && <span className={styles.category}>{project.category}</span>}
      </div>
      <h3 className={styles.name}>{project.name}</h3>
      {project.description && (
        <p className={styles.description}>{project.description}</p>
      )}
      <div className={styles.divider} />
      <div className={styles.footer}>
        <AvatarGroup
          avatars={project.members.map((m) => ({
            name: m.name,
            ...(m.avatarUrl ? { src: m.avatarUrl } : {}),
          }))}
          max={4}
          size="sm"
        />
        <span className={styles.link} aria-hidden="true">
          Open Board →
        </span>
      </div>
    </div>
  );
}
