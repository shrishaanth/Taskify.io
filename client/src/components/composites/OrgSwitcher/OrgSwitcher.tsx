import { Menu, type MenuItem } from "../../primitives/Menu/Menu";
import type { Id, OrgSummary } from "../../../types/domain";
import styles from "./OrgSwitcher.module.css";

export interface OrgSwitcherProps {
  orgs: OrgSummary[];
  currentOrgId: Id;
  onSwitch: (orgId: Id) => void;
  onCreate?: () => void;
}

export function OrgSwitcher({
  orgs,
  currentOrgId,
  onSwitch,
  onCreate,
}: OrgSwitcherProps) {
  const current = orgs.find((o) => o.id === currentOrgId) ?? orgs[0];
  const initial = current?.name.charAt(0).toUpperCase() ?? "?";

  const items: MenuItem[] = [
    ...orgs.map((o) => ({
      id: o.id,
      label: (
        <>
          {o.name}
          {o.id === current?.id && (
            <span className={styles.check} aria-hidden="true">
              ✓
            </span>
          )}
        </>
      ),
      onSelect: () => onSwitch(o.id),
    })),
    ...(onCreate
      ? [
          {
            id: "__create__",
            label: "Create Organization",
            onSelect: onCreate,
          } satisfies MenuItem,
        ]
      : []),
  ];

  return (
    <Menu
      menuLabel="Switch organization"
      placement="bottom-start"
      trigger={
        <button type="button" className={styles.trigger}>
          <span className={styles.mark} aria-hidden="true">
            {initial}
          </span>
          {current?.name ?? "Select organization"}
          <span className={styles.chev} aria-hidden="true">
            ▾
          </span>
        </button>
      }
      items={items}
    />
  );
}
