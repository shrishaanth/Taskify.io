import { forwardRef } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Select.module.css";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: "sm" | "md";
  invalid?: boolean;
  leadingIcon?: ReactNode;
  /** Convenience: pass options instead of `<option>` children. */
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    size = "md",
    invalid = false,
    leadingIcon,
    options,
    disabled = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <span
      className={styles.wrapper}
      data-size={size}
      data-invalid={invalid ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
    >
      {leadingIcon && (
        <span className={styles.affix} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <select
        ref={ref}
        className={cn(styles.field, className)}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <span className={styles.chevron} aria-hidden="true">
        ▾
      </span>
    </span>
  );
});
