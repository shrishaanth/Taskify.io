import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Spinner } from "../Spinner/Spinner";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    loading = false,
    disabled = false,
    type = "button",
    className,
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      className={cn(styles.root, className)}
      data-variant={variant}
      data-size={size}
      data-full-width={fullWidth ? "true" : "false"}
      data-loading={loading ? "true" : "false"}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span className={styles.spinner}>
          <Spinner size="sm" label="Loading" />
        </span>
      )}
      {leadingIcon && !loading && (
        <span className={styles.icon} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <span className={styles.label} data-hidden={loading ? "true" : "false"}>
        {children}
      </span>
      {trailingIcon && !loading && (
        <span className={styles.icon} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </button>
  );
});
