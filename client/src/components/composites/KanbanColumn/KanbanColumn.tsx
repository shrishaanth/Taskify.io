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
  now,
  className,
}: KanbanColumnProps) {
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

  return (
    <section className={cn(styles.root, className)} aria-label={column.name}>
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

      <div className={styles.list}>
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            done={isDoneColumn}
            onOpen={() => onOpenCard(card.id)}
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
