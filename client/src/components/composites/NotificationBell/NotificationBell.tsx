import { Popover } from "../Popover/Popover";
import {
  NotificationPanel,
  type NotificationPanelProps,
} from "../NotificationPanel/NotificationPanel";
import styles from "./NotificationBell.module.css";

export interface NotificationBellProps
  extends Pick<
    NotificationPanelProps,
    "notifications" | "onMarkAllRead" | "onItemClick" | "now"
  > {
  className?: string;
}

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M6 8a4 4 0 1 1 8 0c0 3 1 4 1 4H5s1-1 1-4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M8.5 15a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export function NotificationBell({
  notifications,
  onMarkAllRead,
  onItemClick,
  now,
  className,
}: NotificationBellProps) {
  const unread = notifications.filter((n) => !n.read).length;
  const badgeText = unread > 9 ? "9+" : String(unread);

  return (
    <Popover
      label="Notifications"
      placement="bottom-end"
      {...(className ? { className } : {})}
      trigger={
        <button
          type="button"
          className={styles.wrap}
          aria-label={
            unread > 0
              ? `Notifications, ${unread} unread`
              : "Notifications"
          }
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-full)",
            width: "2.25rem",
            height: "2.25rem",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-surface)",
            cursor: "pointer",
            color: "var(--text-secondary)",
          }}
        >
          <BellIcon />
          {unread > 0 && (
            <span className={styles.count} data-testid="bell-count">
              {badgeText}
            </span>
          )}
        </button>
      }
    >
      <NotificationPanel
        notifications={notifications}
        onMarkAllRead={onMarkAllRead}
        {...(onItemClick ? { onItemClick } : {})}
        {...(now ? { now } : {})}
      />
    </Popover>
  );
}
