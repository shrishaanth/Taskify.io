import { Menu, type MenuItem } from "../../primitives/Menu/Menu";
import { Avatar } from "../../primitives/Avatar/Avatar";
import type { UserRef } from "../../../types/domain";

export interface UserMenuProps {
  user: UserRef;
  onProfile?: () => void;
  onLogout?: () => void;
  onLogoutAll?: () => void;
}

export function UserMenu({
  user,
  onProfile,
  onLogout,
  onLogoutAll,
}: UserMenuProps) {
  const items: MenuItem[] = [];
  if (onProfile) items.push({ id: "profile", label: "Profile", onSelect: onProfile });
  if (onLogout) items.push({ id: "logout", label: "Log out", onSelect: onLogout });
  if (onLogoutAll)
    items.push({
      id: "logout-all",
      label: "Log out all devices",
      onSelect: onLogoutAll,
      tone: "danger",
    });

  return (
    <Menu
      menuLabel="Account menu"
      placement="bottom-end"
      trigger={
        <button
          type="button"
          aria-label={`Account: ${user.name}`}
          style={{ border: 0, background: "none", padding: 0, cursor: "pointer" }}
        >
          <Avatar
            name={user.name}
            {...(user.avatarUrl ? { src: user.avatarUrl } : {})}
            size="md"
            showStatus
            status="online"
          />
        </button>
      }
      items={items}
    />
  );
}
