import { cn } from "../../utils/cn";
import { OrgSwitcher } from "../OrgSwitcher/OrgSwitcher";
import { NotificationBell } from "../NotificationBell/NotificationBell";
import { UserMenu } from "../UserMenu/UserMenu";
import { SearchInput } from "../SearchInput/SearchInput";
import type { AppNotification, Id, OrgSummary, UserRef } from "../../../types/domain";
import styles from "./TopNavBar.module.css";

export interface TopNavBarProps {
  orgs: OrgSummary[];
  currentOrgId: Id;
  onSwitchOrg: (id: Id) => void;
  onCreateOrg?: () => void;
  notifications: AppNotification[];
  onMarkAllNotificationsRead: () => void;
  onNotificationClick?: (id: string) => void;
  user: UserRef;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
  onProfile?: () => void;
  onLogout?: () => void;
  onLogoutAll?: () => void;
  now?: Date;
  className?: string;
}

const LogoGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 4h10M3 8h10M3 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export function TopNavBar({
  orgs,
  currentOrgId,
  onSwitchOrg,
  onCreateOrg,
  notifications,
  onMarkAllNotificationsRead,
  onNotificationClick,
  user,
  onSearch,
  searchPlaceholder = "Search projects…",
  onProfile,
  onLogout,
  onLogoutAll,
  now,
  className,
}: TopNavBarProps) {
  return (
    <header className={cn(styles.root, className)}>
      <span className={styles.brand}>
        <span className={styles.logo}>
          <LogoGlyph />
        </span>
        Taskify
      </span>

      <OrgSwitcher
        orgs={orgs}
        currentOrgId={currentOrgId}
        onSwitch={onSwitchOrg}
        {...(onCreateOrg ? { onCreate: onCreateOrg } : {})}
      />

      <span className={styles.spacer} />

      <SearchInput
        className={styles.search}
        placeholder={searchPlaceholder}
        {...(onSearch ? { onSearch } : {})}
      />

      <div className={styles.right}>
        <NotificationBell
          notifications={notifications}
          onMarkAllRead={onMarkAllNotificationsRead}
          {...(onNotificationClick ? { onItemClick: onNotificationClick } : {})}
          {...(now ? { now } : {})}
        />
        <UserMenu
          user={user}
          {...(onProfile ? { onProfile } : {})}
          {...(onLogout ? { onLogout } : {})}
          {...(onLogoutAll ? { onLogoutAll } : {})}
        />
      </div>
    </header>
  );
}
