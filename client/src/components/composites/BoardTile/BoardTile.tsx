import { cn } from "../../utils/cn";
import type { BoardSummary } from "../../../types/domain";
import styles from "./BoardTile.module.css";

export interface BoardTileProps {
  board: BoardSummary;
  onOpen: () => void;
  className?: string;
}

export function BoardTile({ board, onOpen, className }: BoardTileProps) {
  const color = board.colorKey ?? "sky";
  return (
    <button
      type="button"
      className={cn(styles.root, className)}
      data-color={color}
      onClick={onOpen}
    >
      <h3 className={styles.name}>{board.name}</h3>
      <span className={styles.meta}>
        <svg className={styles.icon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="3" y="2" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 1.5h4v2H6z" fill="currentColor" />
        </svg>
        {board.cardCount} {board.cardCount === 1 ? "card" : "cards"}
      </span>
      <span className={styles.link} aria-hidden="true">
        Open Board →
      </span>
    </button>
  );
}
