import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Surface.module.css";

type SurfaceTag = "div" | "section" | "article" | "aside" | "li" | "ul" | "form";

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: SurfaceTag;
  padding?: "none" | "sm" | "md" | "lg";
  /** Hover elevation + pointer cursor. Ignored when `muted`. */
  interactive?: boolean;
  /** Locked / no-access look: desaturated, no hover, not-allowed cursor. */
  muted?: boolean;
  elevated?: boolean;
  children?: ReactNode;
}

export function Surface({
  as: Tag = "div",
  padding = "md",
  interactive = false,
  muted = false,
  elevated = false,
  className,
  children,
  ...rest
}: SurfaceProps) {
  return (
    <Tag
      className={cn(styles.root, className)}
      data-padding={padding}
      data-interactive={interactive && !muted ? "true" : "false"}
      data-muted={muted ? "true" : "false"}
      data-elevated={elevated ? "true" : "false"}
      {...rest}
    >
      {children}
    </Tag>
  );
}
