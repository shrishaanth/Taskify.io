import { Avatar } from "../../primitives/Avatar/Avatar";
import { RoleBadge } from "../RoleBadge/RoleBadge";
import type { OrgRole, ProjectRole, UserRef } from "../../../types/domain";
import styles from "./MembersTable.module.css";

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 4h10M6.5 4V3h3v1M4.5 4l.5 9h6l.5-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export interface MemberRowProps {
  user: UserRef;
  email: string;
  role: OrgRole | ProjectRole;
  scope: "org" | "project";
  canManage: boolean;
  /** Block role/removal changes (e.g. the last remaining Owner — FR-1.6). */
  lockManage?: boolean;
  onChangeRole?: (role: OrgRole | ProjectRole) => void;
  onRemove?: () => void;
}

export function MemberRow({
  user,
  email,
  role,
  scope,
  canManage,
  lockManage = false,
  onChangeRole,
  onRemove,
}: MemberRowProps) {
  const editable = canManage && !lockManage;

  return (
    <tr>
      <td className={styles.td}>
        <span className={styles.member}>
          <Avatar
            name={user.name}
            {...(user.avatarUrl ? { src: user.avatarUrl } : {})}
            size="md"
          />
          {user.name}
        </span>
      </td>
      <td className={`${styles.td} ${styles.email}`}>{email}</td>
      <td className={styles.td}>
        <RoleBadge
          scope={scope}
          role={role}
          size="sm"
          uppercase={scope === "org"}
          {...(editable && onChangeRole ? { editable: true, onChange: onChangeRole } : {})}
        />
      </td>
      <td className={`${styles.td} ${styles.actions}`}>
        {canManage && (
          <button
            type="button"
            className={styles.remove}
            aria-label={`Remove ${user.name}`}
            disabled={lockManage}
            {...(onRemove ? { onClick: onRemove } : {})}
          >
            <TrashIcon />
          </button>
        )}
      </td>
    </tr>
  );
}
