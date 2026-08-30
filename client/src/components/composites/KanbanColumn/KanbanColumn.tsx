import { useState } from "react";
import { cn } from "../../utils/cn";
import { IconButton } from "../../primitives/IconButton/IconButton";
import { Menu, type MenuItem } from "../../primitives/Menu/Menu";
import { KanbanCard } from "../KanbanCard/KanbanCard";
import type { CardSummary, Column } from "../../../types/domain";
import styles from "./KanbanColumn.module.css";

export interface KanbanColumnProps {
  column: Column;
  cards: CardSummary[];
  onAddCard: () => void;
  onOpenCard: (cardId: string) => void;
  /** Show the column ⋯ menu (rename / delete). */
  canManage?: boolean;
  onRenameColumn?: () => void;
  onDeleteColumn?: () => void;
  /** This column represents "done" — cards never show as overdue. */
  isDoneColumn?: boolean;
  /** Enables drag-to-reorder / move between columns. */
  draggable?: boolean;
  /** Id of the card currently being dragged (from anywhere on the board). */
  draggingCardId?: string | null;
  onCardDragStart?: (cardId: string) => void;
  onCardDragEnd?: () => void;
  /**
   * A dragged card was dropped on this column. `beforeCardId` is the card it
   * should land in front of, or null to append to the end.
   */
  onCardDrop?: (payload: { beforeCardId: string | null }) => void;
  now?: Date;
  className?: string;
}

export function KanbanColumn({
  column,
  cards,
  onAddCard,
  onOpenCard,
  canManage = false,
  onRenameColumn,
  onDeleteColumn,
  isDoneColumn = false,
  draggable = false,
  draggingCardId = null,
  onCardDragStart,
  onCardDragEnd,
  onCardDrop,
  now,
  className,
}: KanbanColumnProps) {
  const [dropBeforeId, setDropBeforeId] = useState<string | null | undefined>(
    undefined,
  );
  const dragActive = draggable && Boolean(draggingCardId) && Boolean(onCardDrop);

  const menuItems: MenuItem[] = [];
  if (onRenameColumn)
    menuItems.push({ id: "rename", label: "Rename column", onSelect: onRenameColumn });
  if (onDeleteColumn)
    menuItems.push({
      id: "delete",
      label: "Delete column",
      onSelect: onDeleteColumn,
      tone: "danger",
    });

  const finishDrop = (beforeCardId: string | null) => {
    setDropBeforeId(undefined);
    onCardDrop?.({ beforeCardId });
  };

  return (
    <section
      className={cn(styles.root, className)}
      aria-label={column.name}
      data-testid="kanban-column"
      data-drag-over={dragActive && dropBeforeId !== undefined ? "true" : "false"}
    >
      <div className={styles.header}>
        <h3 className={styles.name}>{column.name}</h3>
        <span className={styles.count}>{cards.length}</span>
        {canManage && menuItems.length > 0 && (
          <span className={styles.menuAnchor}>
            <Menu
              menuLabel={`${column.name} column actions`}
              placement="bottom-end"
              trigger={
                <IconButton
                  label={`${column.name} column actions`}
                  icon={<span aria-hidden="true">⋯</span>}
                  size="sm"
                />
              }
              items={menuItems}
            />
          </span>
        )}
      </div>

      <div
        className={styles.list}
        data-testid="kanban-column-list"
        onDragOver={
          dragActive
            ? (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDropBeforeId((prev) => (prev === undefined ? null : prev));
              }
            : undefined
        }
        onDragLeave={
          dragActive
            ? (e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDropBeforeId(undefined);
                }
              }
            : undefined
        }
        onDrop={dragActive ? () => finishDrop(dropBeforeId ?? null) : undefined}
      >
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            done={isDoneColumn}
            draggable={draggable}
            isDragging={draggingCardId === card.id}
            isDropTarget={dragActive && dropBeforeId === card.id}
            onOpen={() => onOpenCard(card.id)}
            {...(draggable && onCardDragStart
              ? { onDragStart: () => onCardDragStart(card.id) }
              : {})}
            {...(draggable && onCardDragEnd
              ? { onDragEnd: onCardDragEnd }
              : {})}
            {...(dragActive
              ? {
                  onDragOverCard: () => setDropBeforeId(card.id),
                  onDropOnCard: () => finishDrop(card.id),
                }
              : {})}
            {...(now ? { now } : {})}
          />
        ))}
      </div>

      <button type="button" className={styles.add} onClick={onAddCard}>
        <span aria-hidden="true">+</span> Add a card
      </button>
    </section>
  );
}
