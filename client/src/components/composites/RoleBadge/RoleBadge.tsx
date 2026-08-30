import { Badge } from "../../primitives/Badge/Badge";
import { Menu } from "../../primitives/Menu/Menu";
import {
  orgRoleTone,
  projectRoleTone,
  noAccessTone,
} from "../../../styles/tokens";
import type { OrgRole, ProjectRole } from "../../../types/domain";

export type RoleValue = OrgRole | ProjectRole | "no-access";

const LABELS: Record<RoleValue, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  head: "Head",
  "no-access": "No access",
};

const ORG_ROLES: OrgRole[] = ["owner", "admin", "member"];
const PROJECT_ROLES: ProjectRole[] = ["head", "member"];

function toneFor(scope: "org" | "project", role: RoleValue) {
  if (role === "no-access") return noAccessTone;
  if (scope === "org") return orgRoleTone[role as OrgRole];
  return projectRoleTone[role as ProjectRole];
}

export interface RoleBadgeProps {
  scope: "org" | "project";
  role: RoleValue;
  /** Render an editable dropdown (ignored for `no-access`). */
  editable?: boolean;
  onChange?: (role: OrgRole | ProjectRole) => void;
  /** Uppercase label (projects-list style); default is title case. */
  uppercase?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function RoleBadge({
  scope,
  role,
  editable = false,
  onChange,
  uppercase = false,
  size = "md",
  className,
}: RoleBadgeProps) {
  const label = uppercase ? LABELS[role].toUpperCase() : LABELS[role];
  const tone = toneFor(scope, role);

  const badge = (
    <Badge tone={tone} size={size} className={className}>
      {label}
    </Badge>
  );

  if (!editable || role === "no-access") return badge;

  const options = (scope === "org" ? ORG_ROLES : PROJECT_ROLES).filter(
    (r) => r !== role,
  );

  return (
    <Menu
      menuLabel={`Change ${scope} role`}
      trigger={
        <button
          type="button"
          aria-label={`${LABELS[role]} — change role`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            background: "none",
            border: 0,
            padding: 0,
            cursor: "pointer",
          }}
        >
          {badge}
          <span aria-hidden="true">▾</span>
        </button>
      }
      items={options.map((r) => ({
        id: r,
        label: LABELS[r],
        onSelect: () => onChange?.(r),
      }))}
    />
  );
}
