import { cn } from "../../utils/cn";
import { Chip } from "../../primitives/Chip/Chip";
import { Avatar } from "../../primitives/Avatar/Avatar";
import { DueDateChip } from "../DueDateChip/DueDateChip";
import { labelToneFor } from "../../../lib/labelColor";
import type { CardSummary } from "../../../types/domain";
import styles from "./KanbanCard.module.css";

export interface KanbanCardProps {
  card: CardSummary;
  /** Column is a "done" column — suppresses overdue styling. */
  done?: boolean;
  isDragging?: boolean;
  onOpen: () => void;
  now?: Date;
  className?: string;
}

const CheckMini = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 8l2 2 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CommentMini = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3h10v7H7l-3 3v-3H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export function KanbanCard({
  card,
  done = false,
  isDragging = false,
  onOpen,
  now,
  className,
}: KanbanCardProps) {
  const assignee = card.assignees[0];

  return (
    <button
      type="button"
      className={cn(styles.root, className)}
      data-dragging={isDragging ? "true" : "false"}
      aria-roledescription="Card"
      onClick={onOpen}
    >
      {card.labels.length > 0 && (
        <span className={styles.labels}>
          {card.labels.map((label) => (
            <Chip key={label} tone={labelToneFor(label)} size="sm">
              {label}
            </Chip>
          ))}
        </span>
      )}

      <h4 className={styles.title}>{card.title}</h4>

      <div className={styles.footer}>
        {card.dueDate && (
          <DueDateChip
            date={card.dueDate}
            done={done}
            size="sm"
            {...(now ? { now } : {})}
          />
        )}
        {card.subtaskTotal > 0 && (
          <span className={styles.meta} data-testid="subtask-progress">
            <CheckMini />
            {card.subtaskDone}/{card.subtaskTotal}
          </span>
        )}
        {card.commentCount > 0 && (
          <span className={styles.meta} data-testid="comment-count">
            <CommentMini />
            {card.commentCount}
          </span>
        )}
        {assignee && (
          <span className={styles.assignee}>
            <Avatar
              name={assignee.name}
              {...(assignee.avatarUrl ? { src: assignee.avatarUrl } : {})}
              size="sm"
            />
          </span>
        )}
      </div>
    </button>
  );
}
