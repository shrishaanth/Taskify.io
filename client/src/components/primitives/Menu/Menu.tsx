import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import styles from "./Menu.module.css";

export type MenuPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end";

export interface MenuItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}

interface TriggerProps {
  onClick?: (e: ReactMouseEvent) => void;
  "aria-haspopup"?: string;
  "aria-expanded"?: boolean;
}

export interface MenuProps {
  trigger: ReactElement<TriggerProps>;
  items: MenuItem[];
  placement?: MenuPlacement;
  menuLabel?: string;
  /** Controlled open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function Menu({
  trigger,
  items,
  placement = "bottom-start",
  menuLabel = "Menu",
  open: controlledOpen,
  onOpenChange,
  className,
}: MenuProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const anchorRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [activeIndex, setActiveIndex] = useState(0);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const enabledIndexes = items
    .map((it, i) => (it.disabled ? -1 : i))
    .filter((i) => i >= 0);

  // Close on outside pointer + Escape.
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

  // Focus the first enabled item when the menu opens.
  useEffect(() => {
    if (!open) return;
    const firstEnabled = enabledIndexes[0] ?? 0;
    setActiveIndex(firstEnabled);
    menuRef.current
      ?.querySelectorAll<HTMLElement>('[role="menuitem"]')
      ?.[firstEnabled]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const focusItem = (index: number) => {
    setActiveIndex(index);
    menuRef.current
      ?.querySelectorAll<HTMLElement>('[role="menuitem"]')
      ?.[index]?.focus();
  };

  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (enabledIndexes.length === 0) return;
    const pos = enabledIndexes.indexOf(activeIndex);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(enabledIndexes[(pos + 1) % enabledIndexes.length]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(
        enabledIndexes[(pos - 1 + enabledIndexes.length) % enabledIndexes.length],
      );
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(enabledIndexes[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(enabledIndexes[enabledIndexes.length - 1]);
    }
  };

  const select = (item: MenuItem) => {
    if (item.disabled) return;
    item.onSelect();
    setOpen(false);
    (anchorRef.current?.firstElementChild as HTMLElement | null)?.focus();
  };

  const clonedTrigger = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: (e: ReactMouseEvent) => {
          trigger.props.onClick?.(e);
          setOpen(!open);
        },
        "aria-haspopup": "menu",
        "aria-expanded": open,
      })
    : trigger;

  return (
    <span className={cn(styles.anchor, className)} ref={anchorRef}>
      {clonedTrigger}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={menuLabel}
          data-placement={placement}
          className={styles.menu}
          onKeyDown={onMenuKeyDown}
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              tabIndex={i === activeIndex ? 0 : -1}
              disabled={item.disabled ?? false}
              data-tone={item.tone ?? "default"}
              className={styles.item}
              onClick={() => select(item)}
            >
              {item.icon && (
                <span className={styles.icon} aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
