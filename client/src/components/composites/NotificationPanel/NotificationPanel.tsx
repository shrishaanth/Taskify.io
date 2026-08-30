import { cn } from "../../utils/cn";
import { EmptyState } from "../EmptyState/EmptyState";
import { NotificationItem } from "../NotificationItem/NotificationItem";
import type { AppNotification } from "../../../types/domain";
import styles from "./NotificationPanel.module.css";

export interface NotificationPanelProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onItemClick?: (id: string) => void;
  now?: Date;
  className?: string;
}

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.5 8.5l3 3 6-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function NotificationPanel({
  notifications,
  onMarkAllRead,
  onItemClick,
  now,
  className,
}: NotificationPanelProps) {
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className={cn(styles.root, className)}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Notifications</h2>
        <button
          type="button"
          className={styles.markAll}
          onClick={onMarkAllRead}
          disabled={!hasUnread}
        >
          Mark all as read
        </button>
      </div>
      {notifications.length === 0 ? (
        <EmptyState
          icon={<CheckIcon />}
          tone="slate"
          title="You're all caught up!"
          description="No new alerts. Enjoy your clean inbox."
        />
      ) : (
        <div className={styles.list}>
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              {...(now ? { now } : {})}
              {...(onItemClick ? { onClick: () => onItemClick(n.id) } : {})}
            />
          ))}
        </div>
      )}
    </div>
  );
}
