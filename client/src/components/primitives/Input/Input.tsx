import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Input.module.css";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md";
  invalid?: boolean;
  leadingIcon?: ReactNode;
  /** Trailing content — e.g. a password show/hide toggle or a clear button. */
  trailingSlot?: ReactNode;
  /** Class applied to the outer wrapper (the visible field box). */
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = "md",
    invalid = false,
    leadingIcon,
    trailingSlot,
    disabled = false,
    className,
    wrapperClassName,
    ...rest
  },
  ref,
) {
  return (
    <span
      className={cn(styles.wrapper, wrapperClassName)}
      data-size={size}
      data-invalid={invalid ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
    >
      {leadingIcon && (
        <span className={styles.affix} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(styles.field, className)}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      {trailingSlot && <span className={styles.affix}>{trailingSlot}</span>}
    </span>
  );
});
