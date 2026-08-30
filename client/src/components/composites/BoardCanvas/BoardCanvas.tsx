import { useRef, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { AddTile } from "../AddTile/AddTile";
import { KanbanColumn } from "../KanbanColumn/KanbanColumn";
import type { CardSummary, Column } from "../../../types/domain";
import { useFlipCards } from "./useFlipCards";
import styles from "./BoardCanvas.module.css";

export interface BoardCanvasProps {
  columns: Column[];
  cardsByColumn: Record<string, CardSummary[]>;
  onAddCard: (columnId: string) => void;
  onOpenCard: (cardId: string) => void;
  onAddColumn?: () => void;
  onRenameColumn?: (columnId: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  /**
   * Move a card via drag-and-drop. `beforeCardId` is the card to drop in front
   * of, or null to append to the end of `toColumnId`.
   */
  onMoveCard?: (
    cardId: string,
    toColumnId: string,
    beforeCardId: string | null,
  ) => void;
  /** Head/Member both true — controls the column ⋯ menu + add-column tile. */
  canManage?: boolean;
  /** Column ids treated as "done" for overdue suppression. */
  doneColumnIds?: string[];
  /** Rendered instead of the board when there are no columns. */
  emptyState?: ReactNode;
  now?: Date;
  className?: string;
}

export function BoardCanvas({
  columns,
  cardsByColumn,
  onAddCard,
  onOpenCard,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onMoveCard,
  canManage = false,
  doneColumnIds = [],
  emptyState,
  now,
  className,
}: BoardCanvasProps) {
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const dndEnabled = canManage && Boolean(onMoveCard);
  const rootRef = useRef<HTMLDivElement>(null);

  const ordered = [...columns].sort((a, b) => a.order - b.order);
  // changes whenever a card's column/position could have shifted
  const flipSignature = ordered
    .map((c) => (cardsByColumn[c.id] ?? []).map((x) => x.id).join(","))
    .join("|");
  useFlipCards(rootRef, flipSignature);

  if (columns.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div ref={rootRef} className={cn(styles.root, className)}>
      {ordered.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          cards={cardsByColumn[column.id] ?? []}
          canManage={canManage}
          isDoneColumn={doneColumnIds.includes(column.id)}
          draggable={dndEnabled}
          draggingCardId={draggingCardId}
          onAddCard={() => onAddCard(column.id)}
          onOpenCard={onOpenCard}
          {...(dndEnabled
            ? {
                onCardDragStart: (cardId: string) => setDraggingCardId(cardId),
                onCardDragEnd: () => setDraggingCardId(null),
                onCardDrop: ({ beforeCardId }: { beforeCardId: string | null }) => {
                  if (draggingCardId && draggingCardId !== beforeCardId) {
                    onMoveCard?.(draggingCardId, column.id, beforeCardId);
                  }
                  setDraggingCardId(null);
                },
              }
            : {})}
          {...(canManage && onRenameColumn
            ? { onRenameColumn: () => onRenameColumn(column.id) }
            : {})}
          {...(canManage && onDeleteColumn
            ? { onDeleteColumn: () => onDeleteColumn(column.id) }
            : {})}
          {...(now ? { now } : {})}
        />
      ))}
      {canManage && onAddColumn && (
        <div className={styles.addColumn}>
          <AddTile label="Add column" onClick={onAddColumn} />
        </div>
      )}
    </div>
  );
}
