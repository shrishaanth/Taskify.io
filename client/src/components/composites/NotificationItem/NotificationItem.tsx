import type { ReactElement } from "react";
import { cn } from "../../utils/cn";
import { formatRelativeTime } from "../../../lib/format";
import type { AppNotification, NotificationType } from "../../../types/domain";
import styles from "./NotificationItem.module.css";

const DocIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 2h5l3 3v9H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const ChatIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3h10v7H7l-3 3v-3H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2l5 2v4c0 3-2 5-5 6-3-1-5-3-5-6V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
const UserCheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10.5 8.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICONS: Record<NotificationType, () => ReactElement> = {
  card_assigned: DocIcon,
  comment_mention: ChatIcon,
  role_changed: ShieldIcon,
  invite_accepted: UserCheckIcon,
};

export interface NotificationItemProps {
  notification: AppNotification;
  onClick?: () => void;
  now?: Date;
  className?: string;
}

export function NotificationItem({
  notification,
  onClick,
  now,
  className,
}: NotificationItemProps) {
  const Icon = ICONS[notification.type];
  const unread = !notification.read;

  return (
    <button
      type="button"
      className={cn(styles.root, className)}
      data-unread={unread ? "true" : "false"}
      data-type={notification.type}
      onClick={onClick}
    >
      <span className={styles.icon}>
        <Icon />
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{notification.title}</span>
        <br />
        <span className={styles.time}>
          {formatRelativeTime(notification.createdAt, now)}
        </span>
      </span>
      {unread && <span className={styles.dot} aria-label="Unread" />}
    </button>
  );
}
