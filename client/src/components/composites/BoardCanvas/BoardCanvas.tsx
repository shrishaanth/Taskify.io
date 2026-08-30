import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { AddTile } from "../AddTile/AddTile";
import { KanbanColumn } from "../KanbanColumn/KanbanColumn";
import type { CardSummary, Column } from "../../../types/domain";
import styles from "./BoardCanvas.module.css";

export interface BoardCanvasProps {
  columns: Column[];
  cardsByColumn: Record<string, CardSummary[]>;
  onAddCard: (columnId: string) => void;
  onOpenCard: (cardId: string) => void;
  onAddColumn?: () => void;
  onRenameColumn?: (columnId: string) => void;
  onDeleteColumn?: (columnId: string) => void;
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
  canManage = false,
  doneColumnIds = [],
  emptyState,
  now,
  className,
}: BoardCanvasProps) {
  if (columns.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const ordered = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className={cn(styles.root, className)}>
      {ordered.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          cards={cardsByColumn[column.id] ?? []}
          canManage={canManage}
          isDoneColumn={doneColumnIds.includes(column.id)}
          onAddCard={() => onAddCard(column.id)}
          onOpenCard={onOpenCard}
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
