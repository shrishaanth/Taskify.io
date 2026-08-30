import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./IconButton.module.css";

export type IconButtonVariant = "ghost" | "circle";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  icon: ReactNode;
  /** Required — becomes the button's accessible name. */
  label: string;
  variant?: IconButtonVariant;
  size?: "sm" | "md";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon, label, variant = "ghost", size = "md", type = "button", className, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(styles.root, className)}
        data-variant={variant}
        data-size={size}
        {...rest}
      >
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      </button>
    );
  },
);
