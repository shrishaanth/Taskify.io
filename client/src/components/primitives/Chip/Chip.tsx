import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import type { BadgeTone } from "../Badge/Badge";
import styles from "./Chip.module.css";

export type ChipTone = BadgeTone;

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  size?: "sm" | "md";
  removable?: boolean;
  onRemove?: () => void;
  /** Accessible label for the remove control when children aren't plain text. */
  removeLabel?: string;
  children: ReactNode;
}

export function Chip({
  tone = "slate",
  size = "md",
  removable = false,
  onRemove,
  removeLabel,
  className,
  children,
  ...rest
}: ChipProps) {
  const label =
    removeLabel ??
    (typeof children === "string" ? `Remove ${children}` : "Remove label");

  return (
    <span
      className={cn(styles.root, className)}
      data-tone={tone}
      data-size={size}
      {...rest}
    >
      {children}
      {removable && (
        <button
          type="button"
          className={styles.remove}
          aria-label={label}
          onClick={onRemove}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
}

export interface AddChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Optional text after the "+"; defaults to just the icon. */
  label?: ReactNode;
  size?: "sm" | "md";
}

export function AddChip({
  label,
  size = "md",
  className,
  type = "button",
  ...rest
}: AddChipProps) {
  return (
    <button
      type={type}
      className={cn(styles.add, className)}
      data-size={size}
      {...rest}
    >
      <span aria-hidden="true">+</span>
      {label}
    </button>
  );
}
