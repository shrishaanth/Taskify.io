import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "../../utils/cn";
import { IconButton } from "../../primitives/IconButton/IconButton";
import { Menu, type MenuItem } from "../../primitives/Menu/Menu";
import { Skeleton } from "../../primitives/Skeleton/Skeleton";
import { KanbanCard } from "../KanbanCard/KanbanCard";
import type { CardSummary, Column } from "../../../types/domain";
import styles from "./KanbanColumn.module.css";

export interface KanbanColumnProps {
  column: Column;
  cards: CardSummary[];
  /** Colour of the strip along the top of the column. */
  accent?: string;
  /** Cards are still being fetched; show placeholders instead of an empty list. */
  loading?: boolean;
  /** Receives the title typed into the inline composer. */
  onAddCard: (title: string) => void;
  onOpenCard: (cardId: string) => void;
  canManage?: boolean;
  /** Receives the new name typed into the header. */
  onRenameColumn?: (name: string) => void;
  onDeleteColumn?: () => void;
  isDoneColumn?: boolean;
  draggable?: boolean;
  draggingCardId?: string | null;
  onCardDragStart?: (cardId: string) => void;
  onCardDragEnd?: () => void;
  onCardDrop?: (payload: { beforeCardId: string | null }) => void;
  now?: Date;
  className?: string;
}

/** Marks where the dragged card will land. Purely visual; the list takes the drop. */
function DropSlot() {
  return <div className={styles.dropSlot} data-testid="drop-slot" aria-hidden="true" />;
}

export function KanbanColumn({
  column,
  cards,
  loading = false,
  accent,
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
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const dragActive = draggable && Boolean(draggingCardId) && Boolean(onCardDrop);

  useEffect(() => {
    if (composing) draftRef.current?.focus();
  }, [composing]);

  useEffect(() => {
    if (renaming) renameRef.current?.select();
  }, [renaming]);

  const commitRename = (value: string) => {
    const name = value.trim();
    setRenaming(false);
    if (name && name !== column.name) onRenameColumn?.(name);
  };

  const submitDraft = () => {
    const title = draft.trim();
    if (!title) return closeComposer();
    onAddCard(title);
    // Stay open so several cards can be added in a row, the way a list is
    // actually filled in.
    setDraft("");
    draftRef.current?.focus();
  };

  const closeComposer = () => {
    setComposing(false);
    setDraft("");
  };

  const menuItems: MenuItem[] = [];
  if (onRenameColumn)
    menuItems.push({
      id: "rename",
      label: "Rename column",
      onSelect: () => setRenaming(true),
    });
  if (onDeleteColumn)
    menuItems.push({
      id: "delete",
      label: "Delete column",
      onSelect: onDeleteColumn,
      tone: "danger",
    });

  // No slot directly around the dragged card itself: dropping there is a no-op.
  const showSlotBefore = (cardId: string) => {
    if (!dragActive || dropBeforeId !== cardId || cardId === draggingCardId) return false;
    const at = cards.findIndex((c) => c.id === cardId);
    return cards[at - 1]?.id !== draggingCardId;
  };

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
      {...(accent
        ? { style: { "--column-accent": accent } as CSSProperties }
        : {})}
    >
      <div className={styles.header}>
        {renaming ? (
          <input
            ref={renameRef}
            className={styles.renameInput}
            defaultValue={column.name}
            aria-label={`Rename ${column.name}`}
            onBlur={(e) => commitRename(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename(e.currentTarget.value);
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setRenaming(false);
              }
            }}
          />
        ) : (
          <h3 className={styles.name}>{column.name}</h3>
        )}
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

      <div className={styles.body}>
        <div
          className={styles.list}
          data-testid="kanban-column-list"
          onDragEnter={
            dragActive
              ? (e) => {
                  // Without this the browser treats the list as a non-target
                  // until a dragover happens to land on it, so a quick drop
                  // is rejected and the card silently snaps back.
                  e.preventDefault();
                  setDropBeforeId((prev) => (prev === undefined ? null : prev));
                }
              : undefined
          }
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
          onDrop={
            dragActive ? () => finishDrop(dropBeforeId ?? null) : undefined
          }
        >
          {loading && cards.length === 0 && (
            <>
              <Skeleton variant="block" height={56} />
              <Skeleton variant="block" height={56} />
            </>
          )}
          {cards.map((card) => (
            <Fragment key={card.id}>
            {showSlotBefore(card.id) && <DropSlot />}
            <KanbanCard
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
            </Fragment>
          ))}
          {dragActive && dropBeforeId === null && <DropSlot />}
        </div>

        {composing ? (
          <div className={styles.composer}>
            <textarea
              ref={draftRef}
              className={styles.composerInput}
              value={draft}
              rows={2}
              placeholder="What needs doing?"
              aria-label={`New card in ${column.name}`}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitDraft();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  closeComposer();
                }
              }}
            />
            <div className={styles.composerActions}>
              <button
                type="button"
                className={styles.composerAdd}
                onClick={submitDraft}
                disabled={draft.trim().length === 0}
              >
                Add card
              </button>
              <button
                type="button"
                className={styles.composerCancel}
                onClick={closeComposer}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={styles.add}
            onClick={() => setComposing(true)}
          >
            <span aria-hidden="true">+</span> Add a card
          </button>
        )}
      </div>
    </section>
  );
}
