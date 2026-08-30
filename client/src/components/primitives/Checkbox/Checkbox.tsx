import { forwardRef, useEffect, useRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Checkbox.module.css";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  size?: "sm" | "md";
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    { label, size = "md", indeterminate = false, disabled = false, className, ...rest },
    ref,
  ) {
    const innerRef = useRef<HTMLInputElement | null>(null);

    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    const control = (
      <>
        <input
          ref={setRefs}
          type="checkbox"
          className={cn(styles.input, className)}
          disabled={disabled}
          aria-checked={indeterminate ? "mixed" : undefined}
          {...rest}
        />
        <span className={styles.box} data-size={size} aria-hidden="true">
          <svg className={styles.glyph} viewBox="0 0 16 16" fill="none">
            {indeterminate ? (
              <path
                d="M4 8h8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3.5 8.5l3 3 6-7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </span>
      </>
    );

    return (
      <label className={styles.root} data-disabled={disabled ? "true" : "false"}>
        {control}
        {label != null && <span>{label}</span>}
      </label>
    );
  },
);
