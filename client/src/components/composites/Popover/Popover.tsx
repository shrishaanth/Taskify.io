import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { MouseEvent as ReactMouseEvent, ReactElement, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Popover.module.css";

export type PopoverPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end";

interface TriggerProps {
  onClick?: (e: ReactMouseEvent) => void;
  "aria-haspopup"?: string;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
}

export interface PopoverProps {
  trigger: ReactElement<TriggerProps>;
  children: ReactNode;
  /** Accessible label for the popover content region. */
  label: string;
  placement?: PopoverPlacement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function Popover({
  trigger,
  children,
  label,
  placement = "bottom-end",
  open: controlledOpen,
  onOpenChange,
  className,
}: PopoverProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        (anchorRef.current?.firstElementChild as HTMLElement | null)?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const triggerProps: Partial<TriggerProps> = {
    onClick: (e: ReactMouseEvent) => {
      trigger.props.onClick?.(e);
      setOpen(!open);
    },
    "aria-haspopup": "dialog",
    "aria-expanded": open,
  };
  if (open) triggerProps["aria-controls"] = panelId;

  const clonedTrigger = isValidElement(trigger)
    ? cloneElement(trigger, triggerProps)
    : trigger;

  return (
    <span className={cn(styles.anchor, className)} ref={anchorRef}>
      {clonedTrigger}
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={label}
          data-placement={placement}
          className={styles.panel}
        >
          {children}
        </div>
      )}
    </span>
  );
}
