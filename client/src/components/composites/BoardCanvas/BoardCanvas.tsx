import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { AddTile } from "../AddTile/AddTile";
import { KanbanColumn } from "../KanbanColumn/KanbanColumn";
import type { CardSummary, Column } from "../../../types/domain";
import { useFlipCards } from "./useFlipCards";
import { useTouchDrag, type TouchDropTarget } from "./useTouchDrag";
import styles from "./BoardCanvas.module.css";

export interface BoardCanvasProps {
  columns: Column[];
  cardsByColumn: Record<string, CardSummary[]>;
  onAddCard: (columnId: string, title: string) => void;
  onOpenCard: (cardId: string) => void;
  onAddColumn?: (name: string) => void;
  onRenameColumn?: (columnId: string, name: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onMoveCard?: (
    cardId: string,
    toColumnId: string,
    beforeCardId: string | null,
  ) => void;
  canManage?: boolean;
  loadingCards?: boolean;
  doneColumnIds?: string[];
  emptyState?: ReactNode;
  now?: Date;
  className?: string;
}

const STAGE_ACCENTS = [
  "var(--color-sky-500)",
  "var(--color-violet-500)",
  "var(--color-amber-500)",
  "var(--color-pink-500)",
];

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
  loadingCards = false,
  doneColumnIds = [],
  emptyState,
  now,
  className,
}: BoardCanvasProps) {
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [touchTarget, setTouchTarget] = useState<TouchDropTarget | null>(null);
  const [touchDragging, setTouchDragging] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnDraft, setColumnDraft] = useState("");
  const columnInputRef = useRef<HTMLInputElement>(null);
  const dndEnabled = canManage && Boolean(onMoveCard);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (addingColumn) columnInputRef.current?.focus();
  }, [addingColumn]);

  const cancelColumn = () => {
    setAddingColumn(false);
    setColumnDraft("");
  };

  const submitColumn = () => {
    const name = columnDraft.trim();
    if (!name) return cancelColumn();
    onAddColumn?.(name);
    cancelColumn();
  };

  const ordered = [...columns].sort((a, b) => a.order - b.order);
  const flipSignature = ordered
    .map((c) => (cardsByColumn[c.id] ?? []).map((x) => x.id).join(","))
    .join("|");
  useFlipCards(rootRef, flipSignature);

  useTouchDrag(rootRef, dndEnabled && columns.length > 0, {
    onStart: (cardId) => {
      setTouchDragging(true);
      setDraggingCardId(cardId);
    },
    onTarget: setTouchTarget,
    onDrop: (cardId, target) => {
      if (cardId !== target.beforeCardId) {
        onMoveCard?.(cardId, target.columnId, target.beforeCardId);
      }
    },
    onEnd: () => {
      setTouchDragging(false);
      setTouchTarget(null);
      setDraggingCardId(null);
    },
  });

  // First column reads as "not started", done columns as finished, and the
  // stages in between take turns so neighbours are easy to tell apart.
  const accentFor = (columnId: string, index: number) => {
    if (doneColumnIds.includes(columnId)) return "var(--color-green-500)";
    if (index === 0) return "var(--color-slate-400)";
    return STAGE_ACCENTS[(index - 1) % STAGE_ACCENTS.length];
  };

  if (columns.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div ref={rootRef} className={cn(styles.root, className)}>
      {ordered.map((column, index) => (
        <KanbanColumn
          key={column.id}
          column={column}
          cards={cardsByColumn[column.id] ?? []}
          canManage={canManage}
          loading={loadingCards}
          accent={accentFor(column.id, index)}
          isDoneColumn={doneColumnIds.includes(column.id)}
          draggable={dndEnabled}
          draggingCardId={draggingCardId}
          {...(touchDragging
            ? {
                touchDropBeforeId:
                  touchTarget?.columnId === column.id
                    ? touchTarget.beforeCardId
                    : undefined,
              }
            : {})}
          onAddCard={(title) => onAddCard(column.id, title)}
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
            ? { onRenameColumn: (name: string) => onRenameColumn(column.id, name) }
            : {})}
          {...(canManage && onDeleteColumn
            ? { onDeleteColumn: () => onDeleteColumn(column.id) }
            : {})}
          {...(now ? { now } : {})}
        />
      ))}
      {canManage && onAddColumn && (
        <div className={styles.addColumn}>
          {addingColumn ? (
            <div className={styles.columnComposer}>
              <input
                ref={columnInputRef}
                className={styles.columnComposerInput}
                value={columnDraft}
                placeholder="Column name"
                aria-label="New column name"
                onChange={(e) => setColumnDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitColumn();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    cancelColumn();
                  }
                }}
              />
              <div className={styles.columnComposerActions}>
                <button
                  type="button"
                  className={styles.columnComposerAdd}
                  onClick={submitColumn}
                  disabled={columnDraft.trim().length === 0}
                >
                  Add column
                </button>
                <button
                  type="button"
                  className={styles.columnComposerCancel}
                  onClick={cancelColumn}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <AddTile
              label="Add column"
              className={styles.addColumnTile}
              onClick={() => setAddingColumn(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}
