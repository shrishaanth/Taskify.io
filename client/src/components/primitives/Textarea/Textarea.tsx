import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Textarea.module.css";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: "sm" | "md";
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ size = "md", invalid = false, className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(styles.field, className)}
        data-size={size}
        data-invalid={invalid ? "true" : "false"}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
  },
);
