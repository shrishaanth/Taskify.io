import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Divider.module.css";

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export function Divider({
  orientation = "horizontal",
  className,
  ...rest
}: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      data-orientation={orientation}
      className={cn(styles.root, className)}
      {...rest}
    />
  );
}
