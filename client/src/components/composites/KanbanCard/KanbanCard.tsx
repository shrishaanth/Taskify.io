import { cn } from "../../utils/cn";
import { Chip } from "../../primitives/Chip/Chip";
import { AvatarGroup } from "../../primitives/AvatarGroup/AvatarGroup";
import { DueDateChip } from "../DueDateChip/DueDateChip";
import { PriorityBadge } from "../PriorityBadge/PriorityBadge";
import { labelToneFor } from "../../../lib/labelColor";
import type { CardSummary } from "../../../types/domain";
import styles from "./KanbanCard.module.css";

export interface KanbanCardProps {
  card: CardSummary;
  done?: boolean;
  isDragging?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDropTarget?: boolean;
  onDragOverCard?: () => void;
  onDropOnCard?: () => void;
  onOpen: () => void;
  now?: Date;
  className?: string;
}

const DescriptionMini = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 4h10M3 8h10M3 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
  const allDone = card.subtaskTotal > 0 && card.subtaskDone === card.subtaskTotal;
  // The coloured edge already says low or medium; only the ones that need
  // attention also get a written badge.
  const showPriorityBadge = card.priority === "high" || card.priority === "urgent";
  const hasFooter =
    Boolean(card.dueDate) ||
    card.subtaskTotal > 0 ||
    card.commentCount > 0 ||
    Boolean(card.hasDescription) ||
    card.assignees.length > 0;

  return (
    <button
      type="button"
      className={cn(styles.root, className)}
      data-card-id={card.id}
      data-dragging={isDragging ? "true" : "false"}
      data-drop-target={isDropTarget ? "true" : "false"}
      {...(card.priority ? { "data-priority": card.priority } : {})}
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
      onDragEnter={
        onDragOverCard
          ? (e) => {
              // Marks the card as a valid target the moment the pointer
              // arrives. Relying on dragover alone loses drops that are
              // released before the next dragover tick fires.
              e.preventDefault();
              e.stopPropagation();
              onDragOverCard();
            }
          : undefined
      }
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
      {(card.labels.length > 0 || showPriorityBadge) && (
        <span className={styles.labels}>
          {showPriorityBadge && card.priority && (
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

      {hasFooter && (
        <div className={styles.footer}>
          {card.dueDate && (
            <DueDateChip
              date={card.dueDate}
              done={done}
              size="sm"
              {...(now ? { now } : {})}
            />
          )}
          {card.hasDescription && (
            <span className={styles.meta} title="Has a description" data-testid="has-description">
              <DescriptionMini />
            </span>
          )}
          {card.subtaskTotal > 0 && (
            <span
              className={styles.progress}
              data-testid="subtask-progress"
              data-complete={allDone ? "true" : "false"}
            >
              <span className={styles.progressTrack} aria-hidden="true">
                <span
                  className={styles.progressFill}
                  style={{ width: `${(card.subtaskDone / card.subtaskTotal) * 100}%` }}
                />
              </span>
              {card.subtaskDone}/{card.subtaskTotal}
            </span>
          )}
          {card.commentCount > 0 && (
            <span className={styles.meta} data-testid="comment-count">
              <CommentMini />
              {card.commentCount}
            </span>
          )}
          {card.assignees.length > 0 && (
            <span className={styles.assignee}>
              <AvatarGroup
                avatars={card.assignees.map((a) => ({
                  name: a.name,
                  ...(a.avatarUrl ? { src: a.avatarUrl } : {}),
                }))}
                max={3}
                size="sm"
              />
            </span>
          )}
        </div>
      )}
    </button>
  );
}
