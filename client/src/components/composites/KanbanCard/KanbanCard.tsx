import { cn } from "../../utils/cn";
import { Chip } from "../../primitives/Chip/Chip";
import { Avatar } from "../../primitives/Avatar/Avatar";
import { DueDateChip } from "../DueDateChip/DueDateChip";
import { PriorityBadge } from "../PriorityBadge/PriorityBadge";
import { labelToneFor } from "../../../lib/labelColor";
import type { CardSummary } from "../../../types/domain";
import styles from "./KanbanCard.module.css";

export interface KanbanCardProps {
  card: CardSummary;
  /** Column is a "done" column — suppresses overdue styling. */
  done?: boolean;
  isDragging?: boolean;
  /** Enables HTML5 drag to move the card between columns. */
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** A drag is hovering over this card — show an insertion cue. */
  isDropTarget?: boolean;
  onDragOverCard?: () => void;
  onDropOnCard?: () => void;
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
  draggable = false,
  onDragStart,
  onDragEnd,
  isDropTarget = false,
  onDragOverCard,
  onDropOnCard,
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
      data-drop-target={isDropTarget ? "true" : "false"}
      aria-roledescription="Card"
      draggable={draggable}
      onClick={onOpen}
      onDragStart={
        draggable
          ? (e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", card.id);
              onDragStart?.();
            }
          : undefined
      }
      onDragEnd={draggable ? () => onDragEnd?.() : undefined}
      onDragOver={
        onDragOverCard
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onDragOverCard();
            }
          : undefined
      }
      onDrop={
        onDropOnCard
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onDropOnCard();
            }
          : undefined
      }
    >
      {(card.labels.length > 0 || card.priority) && (
        <span className={styles.labels}>
          {card.priority && (
            <PriorityBadge priority={card.priority} size="sm" />
          )}
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
