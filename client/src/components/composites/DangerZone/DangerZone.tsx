import { cn } from "../../utils/cn";
import { Button } from "../../primitives/Button/Button";
import styles from "./DangerZone.module.css";

export interface DangerZoneProps {
  title?: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

export function DangerZone({
  title = "Danger Zone",
  description,
  actionLabel,
  onAction,
  disabled = false,
  helperText,
  className,
}: DangerZoneProps) {
  return (
    <section className={cn(styles.root, className)} aria-label={title}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <Button
        variant="danger"
        size="sm"
        disabled={disabled}
        {...(onAction ? { onClick: onAction } : {})}
      >
        {actionLabel}
      </Button>
      {helperText && <p className={styles.helper}>{helperText}</p>}
    </section>
  );
}
