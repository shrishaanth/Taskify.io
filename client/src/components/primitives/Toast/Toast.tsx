import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { IconButton } from "../IconButton/IconButton";
import styles from "./Toast.module.css";

export type ToastTone = "info" | "success" | "error";

export interface ToastProps {
  tone?: ToastTone;
  title: ReactNode;
  description?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Toast({
  tone = "info",
  title,
  description,
  onDismiss,
  className,
}: ToastProps) {
  return (
    <div
      className={cn(styles.toast, className)}
      data-tone={tone}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {description != null && <p className={styles.description}>{description}</p>}
      </div>
      {onDismiss && (
        <IconButton
          className={styles.dismiss}
          label="Dismiss notification"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          icon={<span aria-hidden="true">×</span>}
        />
      )}
    </div>
  );
}
