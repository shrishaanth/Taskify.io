import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./AddTile.module.css";

export interface AddTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
}

/** Dashed "+ New X" placeholder tile (New Board, Add column, …). */
export function AddTile({ label, className, type = "button", ...rest }: AddTileProps) {
  return (
    <button type={type} className={cn(styles.root, className)} {...rest}>
      <span className={styles.plus} aria-hidden="true">
        +
      </span>
      {label}
    </button>
  );
}
