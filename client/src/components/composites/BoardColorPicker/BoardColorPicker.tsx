import type { KeyboardEvent } from "react";
import { cn } from "../../utils/cn";
import type { BoardColorKey } from "../../../styles/tokens";
import styles from "./BoardColorPicker.module.css";

const COLORS: BoardColorKey[] = ["green", "purple", "red", "amber", "sky", "pink"];

const LABELS: Record<BoardColorKey, string> = {
  green: "Green",
  purple: "Purple",
  red: "Red",
  amber: "Amber",
  sky: "Blue",
  pink: "Pink",
};

export interface BoardColorPickerProps {
  value: BoardColorKey;
  onChange: (value: BoardColorKey) => void;
  className?: string;
  "aria-label"?: string;
}

export function BoardColorPicker({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Board background color",
}: BoardColorPickerProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const idx = COLORS.indexOf(value);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(COLORS[(idx + 1) % COLORS.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(COLORS[(idx - 1 + COLORS.length) % COLORS.length]);
    }
  };

  return (
    <div className={cn(styles.root, className)} role="radiogroup" aria-label={ariaLabel}>
      {COLORS.map((color) => {
        const checked = color === value;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={LABELS[color]}
            tabIndex={checked ? 0 : -1}
            data-color={color}
            className={styles.swatch}
            onClick={() => onChange(color)}
            onKeyDown={onKeyDown}
          >
            {checked && (
              <svg className={styles.check} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3.5 8.5l3 3 6-7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
