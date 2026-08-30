import { cn } from "../../utils/cn";
import { OrgSwitcher } from "../OrgSwitcher/OrgSwitcher";
import { NotificationBell } from "../NotificationBell/NotificationBell";
import { UserMenu } from "../UserMenu/UserMenu";
import type { AppNotification, Id, OrgSummary, UserRef } from "../../../types/domain";
import styles from "./TopNavBar.module.css";

export interface TopNavBarProps {
  orgs: OrgSummary[];
  currentOrgId: Id;
  onSwitchOrg: (id: Id) => void;
  /** Click the logo to go to a safe default landing page. */
  onLogoClick?: () => void;
  onCreateOrg?: () => void;
  onOpenOrgMembers?: () => void;
  onOpenOrgSettings?: () => void;
  notifications: AppNotification[];
  notificationUnreadCount?: number;
  notificationsHasMore?: boolean;
  loadingMoreNotifications?: boolean;
  onLoadMoreNotifications?: () => void;
  onMarkAllNotificationsRead: () => void;
  onNotificationClick?: (id: string) => void;
  user: UserRef;
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
  onLogoClick,
  onCreateOrg,
  onOpenOrgMembers,
  onOpenOrgSettings,
  notifications,
  notificationUnreadCount,
  notificationsHasMore,
  loadingMoreNotifications,
  onLoadMoreNotifications,
  onMarkAllNotificationsRead,
  onNotificationClick,
  user,
  onProfile,
  onLogout,
  onLogoutAll,
  now,
  className,
}: TopNavBarProps) {
  const brandInner = (
    <>
      <span className={styles.logo}>
        <LogoGlyph />
      </span>
      Taskify
    </>
  );

  return (
    <header className={cn(styles.root, className)}>
      {onLogoClick ? (
        <button
          type="button"
          className={cn(styles.brand, styles.brandButton)}
          onClick={onLogoClick}
          aria-label="Taskify home"
        >
          {brandInner}
        </button>
      ) : (
        <span className={styles.brand}>{brandInner}</span>
      )}

      {/* A user with no org (e.g. just after signup) has nothing to switch. */}
      {orgs.length > 0 && (
        <OrgSwitcher
          orgs={orgs}
          currentOrgId={currentOrgId}
          onSwitch={onSwitchOrg}
          {...(onCreateOrg ? { onCreate: onCreateOrg } : {})}
          {...(onOpenOrgMembers ? { onOpenMembers: onOpenOrgMembers } : {})}
          {...(onOpenOrgSettings ? { onOpenSettings: onOpenOrgSettings } : {})}
        />
      )}

      <span className={styles.spacer} />

      <div className={styles.right}>
        <NotificationBell
          notifications={notifications}
          onMarkAllRead={onMarkAllNotificationsRead}
          {...(notificationUnreadCount !== undefined
            ? { unreadCount: notificationUnreadCount }
            : {})}
          {...(notificationsHasMore !== undefined
            ? { hasMore: notificationsHasMore }
            : {})}
          {...(loadingMoreNotifications !== undefined
            ? { loadingMore: loadingMoreNotifications }
            : {})}
          {...(onLoadMoreNotifications
            ? { onLoadMore: onLoadMoreNotifications }
            : {})}
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
