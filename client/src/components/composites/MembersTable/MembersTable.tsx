import { cn } from "../../utils/cn";
import {
  canManageOrgMembers,
  canManageProjectMembers,
  type ViewerContext,
} from "../../../lib/permissions";
import { MemberRow } from "./MemberRow";
import type {
  Id,
  OrgMemberRow,
  OrgRole,
  ProjectMemberRow,
  ProjectRole,
} from "../../../types/domain";
import styles from "./MembersTable.module.css";

type Row = OrgMemberRow | ProjectMemberRow;

export interface MembersTableProps {
  scope: "org" | "project";
  members: Row[];
  viewer: ViewerContext;
  onChangeRole?: (userId: Id, role: OrgRole | ProjectRole) => void;
  onRemove?: (userId: Id) => void;
  className?: string;
}

export function MembersTable({
  scope,
  members,
  viewer,
  onChangeRole,
  onRemove,
  className,
}: MembersTableProps) {
  const canManage =
    scope === "org"
      ? canManageOrgMembers(viewer.orgRole)
      : canManageProjectMembers(viewer);

  const viewerIsOwner = viewer.orgRole === "owner";

  const ownerCount =
    scope === "org"
      ? members.filter((m) => (m as OrgMemberRow).role === "owner").length
      : 0;

  return (
    <table className={cn(styles.table, className)}>
      <thead>
        <tr>
          <th className={styles.th}>Member</th>
          <th className={styles.th}>Email address</th>
          <th className={styles.th}>Role</th>
          <th className={`${styles.th} ${styles.actions}`}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {members.map((m) => {
          const isOwnerRow = scope === "org" && (m as OrgMemberRow).role === "owner";
          const isLastOwner = isOwnerRow && ownerCount <= 1;
          // Only an Owner may grant, change or remove the Owner role; the
          // server enforces this, the table just stops offering it.
          const ownerOnly = isOwnerRow && !viewerIsOwner;
          return (
            <MemberRow
              key={m.user.id}
              user={m.user}
              email={m.user.email ?? ""}
              role={m.role}
              scope={scope}
              canManage={canManage}
              lockManage={isLastOwner || ownerOnly}
              {...(scope === "org" && !viewerIsOwner
                ? { excludeRoles: ["owner" as const] }
                : {})}
              {...(onChangeRole
                ? { onChangeRole: (role: OrgRole | ProjectRole) => onChangeRole(m.user.id, role) }
                : {})}
              {...(onRemove ? { onRemove: () => onRemove(m.user.id) } : {})}
            />
          );
        })}
      </tbody>
    </table>
  );
}
